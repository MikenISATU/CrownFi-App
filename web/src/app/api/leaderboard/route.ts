import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { readJson } from "@/lib/http";

type Row = { id: string; name: string; country: string; sash: string; portraitUrl: string | null; votes: number; rank: number };

// Public, real-time leaderboard. Scopes to the active round (or a ?roundId=), ranking
// contestants by vote total. For a CLOSED round it uses the anchored checkpoint tally
// (verified), so rankings match what was cryptographically sealed. Every contestant is
// included (even with 0 votes) so the board is complete.
export async function GET(req: NextRequest) {
  const roundIdParam = req.nextUrl.searchParams.get("roundId");

  return readJson(async () => {
    const contestants = await db.contestant.findMany({
      select: { id: true, name: true, country: true, sash: true, portraitUrl: true },
    });

    // Choose the round: explicit param → open round → most recent round → none (global).
    let round =
      (roundIdParam ? await db.votingRound.findUnique({ where: { id: roundIdParam } }) : null) ??
      (await db.votingRound.findFirst({ where: { status: "open" }, orderBy: { openedAt: "desc" } })) ??
      (await db.votingRound.findFirst({ orderBy: { openedAt: "desc" } }));

    const counts = new Map<string, number>();
    let total = 0;

    if (round && round.status === "closed") {
      // Verified totals from the anchored checkpoint.
      const cp = await db.checkpoint.findUnique({ where: { roundId: round.id } });
      if (cp) {
        try {
          const tally = JSON.parse(cp.tallyJson) as { contestantId: string; votes: number }[];
          for (const t of tally) counts.set(t.contestantId, t.votes);
        } catch {
          /* fall through to live count below */
        }
      }
    }

    if (counts.size === 0) {
      const where = round ? { roundId: round.id } : {};
      const grouped = await db.vote.groupBy({ by: ["contestantId"], where, _count: { contestantId: true } });
      for (const g of grouped as { contestantId: string; _count: { contestantId: number } }[]) {
        counts.set(g.contestantId, g._count.contestantId);
      }
    }

    const rows: Row[] = contestants
      .map((c) => ({ ...c, votes: counts.get(c.id) ?? 0, rank: 0 }))
      .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
    rows.forEach((r, i) => (r.rank = i + 1));
    total = rows.reduce((s, r) => s + r.votes, 0);

    return {
      roundId: round?.id ?? null,
      roundTitle: round?.title ?? null,
      status: round?.status ?? null,
      verified: Boolean(round && round.status === "closed"),
      total,
      contestants: rows,
    };
  });
}
