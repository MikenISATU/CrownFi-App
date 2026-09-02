import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFan } from "@/lib/fanAuth";
import { baseContracts } from "@/base/contracts";

// STEP 1 of a payout: build the unsigned claim() tx for a winner to sign in Freighter.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireFan(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const market = await db.predictionMarket.findUnique({ where: { id } });
  if (!market) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (market.status !== "resolved") return NextResponse.json({ error: "not_resolved" }, { status: 409 });
  if (market.chainMarketId == null || !baseContracts.predictionMarket) return NextResponse.json({ error: "not_onchain" }, { status: 409 });

  // Require an unclaimed winning position.
  const winning = await db.prediction.findFirst({
    where: { marketId: id, fanId: auth.fanId, option: market.winningOption ?? -1, status: "won" },
  });
  if (!winning) return NextResponse.json({ error: "nothing_to_claim" }, { status: 409 });

  return NextResponse.json({ ok: true, chainMarketId: market.chainMarketId, marketContract: baseContracts.predictionMarket });
}
