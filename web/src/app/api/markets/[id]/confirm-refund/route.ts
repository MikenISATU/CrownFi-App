import { NextRequest, NextResponse } from "next/server";
import { parseEventLogs } from "viem";
import { db } from "@/lib/db";
import { requireFan } from "@/lib/fanAuth";
import { baseContracts } from "@/base/contracts";
import { predictionMarketAbi } from "@/base/abis";
import { addressesEqual, verifiedBaseReceipt } from "@/base/server";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireFan(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const txHash = String(body?.txHash ?? "");
  if (!txHash) return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  const market = await db.predictionMarket.findUnique({ where: { id } });
  if (!market) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (market.status !== "cancelled") return NextResponse.json({ error: "not_cancelled" }, { status: 409 });
  if (market.chainMarketId == null || !baseContracts.predictionMarket) return NextResponse.json({ error: "market_not_onchain" }, { status: 409 });

  try {
    const receipt = await verifiedBaseReceipt({ hash: txHash, from: auth.address, to: baseContracts.predictionMarket });
    const events = parseEventLogs({ abi: predictionMarketAbi, logs: receipt.logs, eventName: "Refunded", strict: true });
    const refunded = events.find((event) => Number(event.args.marketId) === market.chainMarketId && addressesEqual(event.args.user, auth.address));
    if (!refunded) return NextResponse.json({ error: "refund_event_mismatch" }, { status: 409 });
    await db.prediction.updateMany({
      where: { marketId: id, fanId: auth.fanId, status: { in: ["active", "refundable", "lost"] } },
      data: { status: "refunded", claimTxHash: txHash },
    });
    return NextResponse.json({ ok: true, txHash });
  } catch (error: any) {
    console.error("[api/markets/confirm-refund] failed:", error);
    return NextResponse.json({ error: error?.message ?? "confirm_failed" }, { status: 500 });
  }
}
