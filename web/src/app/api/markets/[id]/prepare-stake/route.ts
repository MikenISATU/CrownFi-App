import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFan } from "@/lib/fanAuth";
import { parseOptions } from "@/lib/markets";
import { rateLimit } from "@/lib/ratelimit";
import { clientIp } from "@/lib/ip";
import { baseContracts } from "@/base/contracts";

// Validate a stake before the browser asks the Base wallet to approve USDC and call stake().
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireFan(req);
  if (auth instanceof NextResponse) return auth;

  const rl = rateLimit(`predict:${clientIp(req)}`);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const { id } = await ctx.params;
  const b = await req.json().catch(() => null);
  const option = Number(b?.option);
  const amount = Number(b?.amount);
  if (!Number.isInteger(option) || option < 0) return NextResponse.json({ error: "invalid_option" }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "invalid_amount" }, { status: 400 });

  const market = await db.predictionMarket.findUnique({ where: { id } });
  if (!market) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (market.status !== "open" || market.closeTime.getTime() <= Date.now()) return NextResponse.json({ error: "market_closed" }, { status: 409 });
  if (option >= parseOptions(market.optionsJson).length) return NextResponse.json({ error: "invalid_option" }, { status: 400 });

  if (market.chainMarketId == null || !baseContracts.predictionMarket) {
    return NextResponse.json({ error: "market_not_onchain" }, { status: 409 });
  }
  return NextResponse.json({
    ok: true,
    chainMarketId: market.chainMarketId,
    marketContract: baseContracts.predictionMarket,
    usdcContract: baseContracts.usdc,
  });
}
