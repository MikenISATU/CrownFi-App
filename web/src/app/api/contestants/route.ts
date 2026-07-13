import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { ROSTER } from "@/lib/roster";

// Roster shaped like a Contestant row, for the no-database fallback.
const ROSTER_AS_CONTESTANTS = ROSTER.map((r) => ({
  id: r.id,
  name: r.name,
  country: r.country,
  sash: r.sash,
  portraitUrl: r.photo,
  createdAt: new Date(0).toISOString(),
}));

export async function GET() {
  try {
    const rows = await db.contestant.findMany({ orderBy: { name: "asc" } });
    // If the DB is reachable but empty (not seeded yet), still show the roster.
    return NextResponse.json(rows.length ? rows : ROSTER_AS_CONTESTANTS);
  } catch {
    console.warn("[api/contestants] database unavailable — serving static roster.");
    return NextResponse.json(ROSTER_AS_CONTESTANTS);
  }
}

export async function POST(req: NextRequest) {
  const admin = requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const country = String(body?.country ?? "").trim();
  const sash = String(body?.sash ?? "").trim().toUpperCase();
  if (!name || !country || sash.length !== 2)
    return NextResponse.json({ error: "invalid_fields" }, { status: 400 });

  try {
    const contestant = await db.contestant.create({
      data: { name, country, sash, portraitUrl: `/portraits/${sash.toLowerCase()}.png` },
    });
    // Give every new contestant a default collectible so fans can support them.
    await db.collectible.create({
      data: {
        contestantId: contestant.id,
        title: `${name} - Official Portrait`,
        metadataUri: `ipfs://demo/${sash.toLowerCase()}.json`,
        priceUsdc: 25,
        edition: 1,
      },
    });
    return NextResponse.json(contestant);
  } catch {
    return NextResponse.json({ error: "sash_taken" }, { status: 409 });
  }
}
