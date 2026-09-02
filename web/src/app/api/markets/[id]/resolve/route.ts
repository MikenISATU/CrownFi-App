import { NextRequest, NextResponse } from "next/server";
import { parseEventLogs } from "viem";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { parseOptions } from "@/lib/markets";
import { baseContracts } from "@/base/contracts";
import { predictionMarketAbi } from "@/base/abis";
import { verifiedBaseReceipt } from "@/base/server";

// POST — admin: close / resolve / cancel a market.
// body: { action: "close" | "resolve" | "cancel", winningOption?: number }
// The admin signs the Base transaction in their own wallet. This route verifies the emitted
// contract event before mirroring the status in Supabase.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await ctx.params;
  const b = await req.json().catch(() => null);
  const action = String(b?.action ?? "");
  const txHash = String(b?.txHash ?? "");

  const market = await db.predictionMarket.findUnique({ where: { id }, include: { predictions: true } });
  if (!market) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (market.chainMarketId == null || !baseContracts.predictionMarket) {
    return NextResponse.json({ error: "market_not_onchain" }, { status: 409 });
  }
  if (!txHash) return NextResponse.json({ error: "missing_transaction_hash" }, { status: 400 });

  let receipt;
  try {
    receipt = await verifiedBaseReceipt({ hash: txHash, from: admin.address, to: baseContracts.predictionMarket });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "onchain_failed" }, { status: 409 });
  }

  if (action === "close") {
    if (market.status !== "open") return NextResponse.json({ error: "not_open" }, { status: 409 });
    const events = parseEventLogs({ abi: predictionMarketAbi, logs: receipt.logs, eventName: "MarketClosed", strict: true });
    if (!events.some((event) => Number(event.args.marketId) === market.chainMarketId)) return NextResponse.json({ error: "market_closed_event_missing" }, { status: 409 });
    const m = await db.predictionMarket.update({ where: { id }, data: { status: "closed", resolveTxHash: txHash } });
    return NextResponse.json(m);
  }

  if (action === "cancel") {
    if (market.status === "resolved") return NextResponse.json({ error: "already_resolved" }, { status: 409 });
    const events = parseEventLogs({ abi: predictionMarketAbi, logs: receipt.logs, eventName: "MarketCancelled", strict: true });
    if (!events.some((event) => Number(event.args.marketId) === market.chainMarketId)) return NextResponse.json({ error: "market_cancelled_event_missing" }, { status: 409 });
    await db.$transaction([
      db.predictionMarket.update({ where: { id }, data: { status: "cancelled", resolveTxHash: txHash } }),
      db.prediction.updateMany({ where: { marketId: id, status: "active" }, data: { status: "refundable" } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "resolve") {
    const winningOption = Number(b?.winningOption);
    if (!["open", "closed"].includes(market.status)) return NextResponse.json({ error: "not_resolvable" }, { status: 409 });
    if (!Number.isInteger(winningOption) || winningOption < 0 || winningOption >= parseOptions(market.optionsJson).length) {
      return NextResponse.json({ error: "invalid_option" }, { status: 400 });
    }
    const winnersExist = market.predictions.some((p) => p.option === winningOption);
    if (!winnersExist) return NextResponse.json({ error: "no_winning_stake" }, { status: 409 });

    const events = parseEventLogs({ abi: predictionMarketAbi, logs: receipt.logs, eventName: "MarketResolved", strict: true });
    if (!events.some((event) => Number(event.args.marketId) === market.chainMarketId && Number(event.args.winningOption) === winningOption)) {
      return NextResponse.json({ error: "market_resolved_event_missing" }, { status: 409 });
    }

    await db.$transaction([
      db.predictionMarket.update({ where: { id }, data: { status: "resolved", winningOption, resolveTxHash: txHash } }),
      db.prediction.updateMany({ where: { marketId: id, option: winningOption }, data: { status: "won" } }),
      db.prediction.updateMany({ where: { marketId: id, option: { not: winningOption } }, data: { status: "lost" } }),
    ]);
    return NextResponse.json({ ok: true, resolveTxHash: txHash });
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
