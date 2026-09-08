import { NextRequest, NextResponse } from "next/server";
import { parseEventLogs } from "viem";
import { db } from "@/lib/db";
import { readAdminSession } from "@/lib/adminAuth";
import { readFanSession } from "@/lib/fanAuth";
import { computeMarketView, MAX_MARKET_OPTIONS } from "@/lib/markets";
import { baseContracts } from "@/base/contracts";
import { predictionMarketAbi } from "@/base/abis";
import { verifiedBaseReceipt } from "@/base/server";
import { rateLimit } from "@/lib/ratelimit";
import { clientIp } from "@/lib/ip";

// GET — public list of markets (filters: ?category= ?status= ?pageantId= ?q=).
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const where: any = {};
  if (sp.get("category")) where.category = sp.get("category");
  if (sp.get("status")) where.status = sp.get("status");
  if (sp.get("pageantId")) where.pageantId = sp.get("pageantId");
  const q = sp.get("q")?.trim();
  if (q) where.question = { contains: q, mode: "insensitive" };

  try {
    const rows = await db.predictionMarket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { predictions: { select: { option: true, amount: true, fanId: true } } },
    });
    return NextResponse.json(rows.map((m) => computeMarketView(m, m.predictions)));
  } catch {
    return NextResponse.json([]);
  }
}

// POST — persist a market after the signed-in wallet has created it on Base. Admin-created
// markets are official; fan-created markets are labelled community. The receipt is checked
// independently so neither the creator nor the market details can be forged by the browser.
export async function POST(req: NextRequest) {
  const admin = readAdminSession(req);
  const fan = readFanSession(req);
  if (!admin && !fan) return NextResponse.json({ error: "fan_auth_required" }, { status: 401 });
  if (!admin) {
    const rl = rateLimit(`market:${clientIp(req)}`, 5, 60_000);
    if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  if (!baseContracts.predictionMarket) return NextResponse.json({ error: "market_contract_not_configured" }, { status: 503 });

  const b = await req.json().catch(() => null);
  const question = String(b?.question ?? "").trim().slice(0, 300);
  const category = String(b?.category ?? "").trim().slice(0, 40);
  const options: string[] = Array.isArray(b?.options) ? b.options.map((x: any) => String(x).trim().slice(0, 120)).filter(Boolean) : [];
  const closeTime = b?.closeTime ? new Date(b.closeTime) : null;
  const chainMarketId = Number(b?.chainMarketId);
  const createTxHash = String(b?.createTxHash ?? "");

  if (!question || !category) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  if (options.length < 2 || options.length > MAX_MARKET_OPTIONS) return NextResponse.json({ error: "invalid_options" }, { status: 400 });
  if (!closeTime || isNaN(closeTime.getTime()) || closeTime.getTime() <= Date.now()) return NextResponse.json({ error: "invalid_close_time" }, { status: 400 });
  if (!Number.isSafeInteger(chainMarketId) || chainMarketId <= 0 || !createTxHash) {
    return NextResponse.json({ error: "missing_onchain_confirmation" }, { status: 400 });
  }

  try {
    const duplicate = await db.predictionMarket.findFirst({ where: { OR: [{ chainMarketId }, { createTxHash }] } });
    if (duplicate) return NextResponse.json(computeMarketView(duplicate, []));

    const receipt = await verifiedBaseReceipt({
      hash: createTxHash,
      from: admin?.address ?? fan!.address,
      to: baseContracts.predictionMarket,
    });
    const events = parseEventLogs({ abi: predictionMarketAbi, logs: receipt.logs, eventName: "MarketCreated", strict: true });
    const created = events.find((event) => Number(event.args.marketId) === chainMarketId);
    if (!created) return NextResponse.json({ error: "market_created_event_missing" }, { status: 409 });
    if (
      created.args.question !== question ||
      created.args.category !== category ||
      Number(created.args.numOptions) !== options.length ||
      Number(created.args.closeTime) !== Math.floor(closeTime.getTime() / 1000)
    ) {
      return NextResponse.json({ error: "onchain_market_mismatch" }, { status: 409 });
    }

    const market = await db.predictionMarket.create({
      data: {
        question,
        category,
        optionsJson: JSON.stringify(options),
        closeTime,
        creatorFanId: admin ? null : fan!.fanId,
        pageantId: b?.pageantId ? String(b.pageantId) : null,
        bannerUrl: b?.bannerUrl ? String(b.bannerUrl).slice(0, 400) : null,
        chainMarketId,
        createTxHash,
      },
    });
    return NextResponse.json(market);
  } catch (e) {
    console.error("[api/markets] create failed:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
