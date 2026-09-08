import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mockTicketsStore } from "@/lib/mockStore";
import { TICKET_TIERS, type TierName } from "@/lib/tiers";
import { requireFan } from "@/lib/fanAuth";

const DEMO_EVENT_NAME = "Coronation Night 2026";

function isTierName(tier: string): tier is TierName {
  return Object.prototype.hasOwnProperty.call(TICKET_TIERS, tier);
}

export async function GET() {
  try {
    const tickets = await db.ticket.findMany({
      orderBy: { createdAt: "desc" },
      include: { fan: true },
    });
    return NextResponse.json(tickets);
  } catch {
    console.warn("[api/tickets] database unavailable, returning in-memory mock tickets.");
    return NextResponse.json(mockTicketsStore);
  }
}

// Testnet reservation only. Public ticket minting remains disabled until its Base checkout ships.
export async function POST(req: NextRequest) {
  const auth = requireFan(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  const fanId = auth.fanId;
  const tier = String(body?.tier ?? "").trim();
  const seat = body?.seat ? String(body.seat) : "Unassigned";

  if (!tier) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  if (!isTierName(tier)) return NextResponse.json({ error: "invalid_tier" }, { status: 400 });

  const tierConfig = TICKET_TIERS[tier];

  let fan: { id: string; handle: string; walletAddress?: string | null } | null = null;
  try {
    fan = await db.fan.findUnique({ where: { id: fanId } });
    if (!fan) return NextResponse.json({ error: "fan_not_found" }, { status: 404 });
  } catch {
    // Offline demo fallback only for mock fans created by /api/fans/connect when DB is unavailable.
    if (!fanId.startsWith("mock-fan-")) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    fan = { id: fanId, handle: `fan_${fanId.slice(-6)}`, walletAddress: auth.address };
  }

  const address = fan.walletAddress ?? auth.address;
  const tokenId = null;
  const mintTx = null;

  const ticketData = {
    id: `mock-ticket-${Math.floor(Math.random() * 1000000)}`,
    fanId: fan.id,
    eventName: DEMO_EVENT_NAME,
    tier,
    seat,
    priceUsdc: tierConfig.priceUsdc,
    tokenId,
    mintTx,
    status: "reserved",
    createdAt: new Date().toISOString(),
    fan: { handle: fan.handle, walletAddress: address },
  };

  try {
    const ticket = await db.ticket.create({
      data: {
        fanId: fan.id,
        eventName: DEMO_EVENT_NAME,
        tier,
        seat,
        priceUsdc: tierConfig.priceUsdc,
        tokenId,
        mintTx,
        status: "reserved",
      },
      include: { fan: true },
    });
    mockTicketsStore.unshift(ticket);
    return NextResponse.json({ ok: true, ticket });
  } catch {
    console.warn("[api/tickets] database unavailable, saving mock ticket to in-memory store.");
    mockTicketsStore.unshift(ticketData);
    return NextResponse.json({ ok: true, ticket: ticketData });
  }
}
