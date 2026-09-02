import { NextRequest, NextResponse } from "next/server";
import { parseEventLogs } from "viem";
import { db } from "@/lib/db";
import { requireFan } from "@/lib/fanAuth";
import { baseContracts } from "@/base/contracts";
import { predictionMarketAbi } from "@/base/abis";
import { addressesEqual, verifiedBaseReceipt } from "@/base/server";

// STEP 2 of cancelling a position: submit the fan's signed unstake tx, then remove their
// active position rows for that option (the USDC has been refunded on-chain).
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireFan(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const b = await req.json().catch(() => null);
  const txHash = String(b?.txHash ?? "");
  const option = Number(b?.option);
  if (!txHash || !Number.isInteger(option) || option < 0) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  const market = await db.predictionMarket.findUnique({ where: { id } });
  if (!market) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (market.chainMarketId == null || !baseContracts.predictionMarket) return NextResponse.json({ error: "market_not_onchain" }, { status: 409 });

  try {
    const receipt = await verifiedBaseReceipt({ hash: txHash, from: auth.address, to: baseContracts.predictionMarket });
    const events = parseEventLogs({ abi: predictionMarketAbi, logs: receipt.logs, eventName: "Unstaked", strict: true });
    const unstaked = events.find((event) =>
      Number(event.args.marketId) === market.chainMarketId &&
      Number(event.args.option) === option &&
      addressesEqual(event.args.user, auth.address)
    );
    if (!unstaked) return NextResponse.json({ error: "unstake_event_mismatch" }, { status: 409 });
    await db.prediction.deleteMany({ where: { marketId: id, fanId: auth.fanId, option, status: "active" } });
    return NextResponse.json({ ok: true, txHash });
  } catch (e: any) {
    console.error("[api/markets/confirm-unstake] failed:", e);
    return NextResponse.json({ error: e?.message ?? "confirm_failed" }, { status: 500 });
  }
}
