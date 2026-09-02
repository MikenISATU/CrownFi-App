import { NextRequest, NextResponse } from "next/server";
import { parseEventLogs } from "viem";
import { db } from "@/lib/db";
import { computeCheckpoint, saveCheckpoint } from "@/lib/roundClose";
import { requireAdmin } from "@/lib/adminAuth";
import { baseContracts } from "@/base/contracts";
import { auditAnchorAbi } from "@/base/abis";
import { baseRoundId, bytes32FromDigest } from "@/base/rounds";
import { verifiedBaseReceipt } from "@/base/server";

// STEP 2 of admin-signed anchoring: submit the admin's signed publish() tx, then persist the
// checkpoint and close the round.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id: roundId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const txHash = String(body?.txHash ?? "");
  if (!txHash) return NextResponse.json({ error: "missing_signed_tx" }, { status: 400 });

  const round = await db.votingRound.findUnique({ where: { id: roundId } });
  if (!round) return NextResponse.json({ error: "round_not_found" }, { status: 404 });
  if (round.status === "closed" && round.closedAt)
    return NextResponse.json({ error: "already_closed" }, { status: 409 });

  try {
    if (!baseContracts.auditAnchor) return NextResponse.json({ error: "audit_contract_not_configured" }, { status: 503 });
    const receipt = await verifiedBaseReceipt({ hash: txHash, from: admin.address, to: baseContracts.auditAnchor });
    const cp = await computeCheckpoint(roundId);
    const events = parseEventLogs({ abi: auditAnchorAbi, logs: receipt.logs, eventName: "CheckpointPublished", strict: true });
    const anchored = events.find((event) =>
      event.args.roundId === baseRoundId(roundId) &&
      event.args.merkleRoot === bytes32FromDigest(cp.root) &&
      event.args.tallyHash === bytes32FromDigest(cp.tHash) &&
      Number(event.args.totalVotes) === cp.totalVotes
    );
    if (!anchored) return NextResponse.json({ error: "checkpoint_event_mismatch" }, { status: 409 });
    await saveCheckpoint(roundId, cp, txHash);
    return NextResponse.json({ ok: true, anchorTx: txHash, merkleRoot: cp.root, totalVotes: cp.totalVotes, tally: cp.tally });
  } catch (e: any) {
    console.error("[api/rounds/confirm-close] failed:", e);
    return NextResponse.json({ error: e?.message ?? "confirm_failed" }, { status: 500 });
  }
}
