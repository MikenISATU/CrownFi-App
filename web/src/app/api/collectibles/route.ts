import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFan } from "@/lib/fanAuth";
import { ROSTER } from "@/lib/roster";
import { cached } from "@/lib/serverCache";

// Roster shaped like a Collectible (+ contestant), for the no-database fallback.
const ROSTER_AS_COLLECTIBLES = ROSTER.map((r) => ({
  id: `${r.id}-collectible`,
  title: `${r.name} — Official Portrait`,
  metadataUri: `ipfs://demo/${r.id}.json`,
  priceUsdc: r.priceUsdc,
  edition: 1,
  tokenId: null as string | null,
  contestant: { id: r.id, name: r.name, country: r.country, sash: r.sash, portraitUrl: r.photo },
}));

export async function GET() {
  try {
    // Collectible rows only change when an admin adds a contestant (which invalidates this).
    const rows = await cached("collectibles", 30_000, () =>
      db.collectible.findMany({ orderBy: { createdAt: "desc" }, include: { contestant: true } })
    );
    return NextResponse.json(rows.length ? rows : ROSTER_AS_COLLECTIBLES);
  } catch {
    console.warn("[api/collectibles] database unavailable — serving static roster.");
    return NextResponse.json(ROSTER_AS_COLLECTIBLES);
  }
}

// The catalogue is visible, but public Base minting is intentionally not enabled yet.
export async function POST(req: NextRequest) {
  const auth = requireFan(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ error: "collectibles_coming_soon" }, { status: 409 });
}
