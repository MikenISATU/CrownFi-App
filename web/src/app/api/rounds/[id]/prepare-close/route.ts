import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeCheckpoint } from "@/lib/roundClose";
import { requireAdmin } from "@/lib/adminAuth";
import { baseContracts } from "@/base/contracts";
import { baseRoundId, bytes32FromDigest } from "@/base/rounds";

// Compute the deterministic checkpoint for the admin's Base wallet to publish.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id: roundId } = await ctx.params;
  const round = await db.votingRound.findUnique({ where: { id: roundId } });
  if (!round) return NextResponse.json({ error: "round_not_found" }, { status: 404 });
  if (round.status === "closed" && round.closedAt)
    return NextResponse.json({ error: "already_closed" }, { status: 409 });

  const cp = await computeCheckpoint(roundId);
  if (!baseContracts.auditAnchor) return NextResponse.json({ error: "audit_contract_not_configured" }, { status: 503 });
  return NextResponse.json({
    ok: true,
    contract: baseContracts.auditAnchor,
    chainRoundId: baseRoundId(roundId),
    chainMerkleRoot: bytes32FromDigest(cp.root),
    chainTallyHash: bytes32FromDigest(cp.tHash),
    merkleRoot: cp.root,
    tallyHash: cp.tHash,
    totalVotes: cp.totalVotes,
    tally: cp.tally,
  });
}
