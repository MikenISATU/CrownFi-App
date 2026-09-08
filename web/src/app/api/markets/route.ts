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

type MarketInput = {
  question: string;
  category: string;
  options: string[];
  closeTime: Date | null;
  pageantId: string | null;
  bannerUrl: string | null;
};

function parseMarketInput(body: any): MarketInput {
  return {
    question: String(body?.question ?? "").trim().slice(0, 300),
    category: String(body?.category ?? "").trim().slice(0, 40),
    options: Array.isArray(body?.options)
      ? body.options.map((value: any) => String(value).trim().slice(0, 120)).filter(Boolean)
      : [],
    closeTime: body?.closeTime ? new Date(body.closeTime) : null,
    pageantId: body?.pageantId ? String(body.pageantId) : null,
    bannerUrl: body?.bannerUrl ? String(body.bannerUrl).slice(0, 400) : null,
  };
}

function marketInputError(input: MarketInput): string | null {
  if (!input.question || !input.category) return "missing_fields";
  if (input.options.length < 2 || input.options.length > MAX_MARKET_OPTIONS) return "invalid_options";
  if (!input.closeTime || isNaN(input.closeTime.getTime()) || input.closeTime.getTime() <= Date.now()) return "invalid_close_time";
  return null;
}

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

// PUT — authenticate and verify database readiness before the wallet spends gas.
// The actual market is indexed only after POST independently verifies the Base receipt.
export async function PUT(req: NextRequest) {
  const admin = readAdminSession(req);
  const fan = readFanSession(req);
  if (!admin && !fan) return NextResponse.json({ error: "fan_auth_required" }, { status: 401 });
  if (!baseContracts.predictionMarket) return NextResponse.json({ error: "market_contract_not_configured" }, { status: 503 });

  const rl = rateLimit(`market-preflight:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const input = parseMarketInput(await req.json().catch(() => null));
  const inputError = marketInputError(input);
  if (inputError) return NextResponse.json({ error: inputError }, { status: 400 });

  try {
    if (fan) {
      const creator = await db.fan.findUnique({ where: { id: fan.fanId }, select: { id: true, walletAddress: true } });
      if (!creator || creator.walletAddress.toLowerCase() !== fan.address.toLowerCase()) {
        return NextResponse.json({ error: "fan_auth_required" }, { status: 401 });
      }
    }

    // Selecting the Base-index fields catches an outdated database schema before a transaction.
    await db.predictionMarket.findFirst({
      select: { id: true, creatorFanId: true, chainMarketId: true, createTxHash: true },
    });
    return NextResponse.json({
      ok: true,
      marketContract: baseContracts.predictionMarket,
      creatorAddress: admin?.address ?? fan!.address,
    });
  } catch (error) {
    console.error("[api/markets] preflight failed:", error);
    return NextResponse.json({ error: "market_database_unavailable" }, { status: 503 });
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
  const input = parseMarketInput(b);
  const { question, category, options, closeTime, pageantId, bannerUrl } = input;
  const chainMarketId = Number(b?.chainMarketId);
  const createTxHash = String(b?.createTxHash ?? "");

  const inputError = marketInputError(input);
  if (inputError) return NextResponse.json({ error: inputError }, { status: 400 });
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
      Number(created.args.closeTime) !== Math.floor(closeTime!.getTime() / 1000)
    ) {
      return NextResponse.json({ error: "onchain_market_mismatch" }, { status: 409 });
    }

    const market = await db.predictionMarket.create({
      data: {
        question,
        category,
        optionsJson: JSON.stringify(options),
        closeTime: closeTime!,
        creatorFanId: admin ? null : fan!.fanId,
        pageantId,
        bannerUrl,
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
