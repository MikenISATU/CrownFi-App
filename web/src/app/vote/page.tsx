"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/session/SessionProvider";
import { SpotlightCarousel, Slide } from "@/components/Carousel";
import { Toast } from "@/components/ui";
import { getJson, postJson } from "@/lib/api";
import { Flag } from "@/components/Flag";
import { messageFor } from "@/lib/messages";
import { PAGEANT_SEGMENTS, CATEGORY_LABEL } from "@/lib/segments";

type Round = { id: string; title: string; status: string; category: string | null };
type TallyRow = { id: string; name: string; sash: string; votes: number };
type Board = { total: number; contestants: TallyRow[] };

export default function VotePage() {
  const { fan, ready } = useSession();
  const [cons, setCons] = useState<any[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [activeCat, setActiveCat] = useState<string>(PAGEANT_SEGMENTS[0].key);
  const [picked, setPicked] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [board, setBoard] = useState<Board | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" }>({ msg: "", tone: "ok" });

  // The round you vote in = the open round for the selected category (else its latest round).
  const round = useMemo(() => {
    const inCat = rounds.filter((r) => r.category === activeCat);
    return inCat.find((r) => r.status === "open") ?? inCat[0] ?? null;
  }, [rounds, activeCat]);

  // Category-specific candidate photos: /candidates/<category>/<slug>.webp, falling back to the
  // base portrait (/candidates/<slug>.webp) if a per-category image hasn't been added yet.
  const slides: Slide[] = useMemo(() => cons.map((c: any) => {
    const slug = String(c.country || c.sash).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return {
      id: c.id, name: c.name, country: c.country, sash: c.sash,
      portraitUrl: `/candidates/${activeCat}/${slug}.webp`,
      fallbackUrl: c.portraitUrl ?? `/candidates/${slug}.webp`,
    };
  }), [cons, activeCat]);

  function loadTotals() {
    getJson<Board | null>("/api/leaderboard", null).then((b) => b && setBoard(b));
  }

  useEffect(() => {
    getJson<any[]>("/api/contestants", []).then(setCons);
    getJson<Round[]>("/api/rounds", []).then(setRounds);
    loadTotals();
    const iv = setInterval(loadTotals, 8000); // live vote totals
    return () => clearInterval(iv);
  }, []);

  function flash(msg: string, tone: "ok" | "err") {
    setToast({ msg, tone });
    setTimeout(() => setToast({ msg: "", tone }), 2800);
  }

  async function cast() {
    if (!fan || !round || !picked) return;
    setBusy(true);
    const { ok, data } = await postJson<{ error?: string; pointsAwarded?: number }>("/api/vote", { roundId: round.id, contestantId: picked });
    setBusy(false);
    const err = (data as any)?.error;
    if (ok) { flash(`Vote recorded (+${(data as any)?.pointsAwarded ?? 0} points). Verify it once the round closes.`, "ok"); loadTotals(); }
    else flash(messageFor(err, "Could not record your vote."), "err");
  }

  const maxVotes = Math.max(1, ...(board?.contestants ?? []).map((r) => r.votes));

  return (
    <div>
      <div className="mb-6">
        <div className="eyebrow mb-2">Cast your vote</div>
        <h1 className="font-display text-4xl font-semibold text-[#23252f]">Who wears the crown?</h1>
        <p className="mt-2 text-sm text-[#5f6172]">
          {round ? `${round.title} · ${round.status}` : "Not open for voting yet"}
          <span className="tag-off ml-2">off-chain intake</span>
        </p>
      </div>

      {/* Pageant stages — pick a segment to vote in it. A red dot means it's open now. */}
      <div className="mb-8 flex flex-wrap gap-2">
        {PAGEANT_SEGMENTS.map((s) => {
          const hasOpen = rounds.some((r) => r.category === s.key && r.status === "open");
          const active = activeCat === s.key;
          return (
            <button key={s.key} onClick={() => { setActiveCat(s.key); setPicked(""); }}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${active ? "border-transparent bg-gradient-to-b from-[#d4af37] to-[#b8912f] text-[#1a1f35]" : "border-[#e7e2d3] bg-white text-[#5f6172] hover:border-[#c9a227]"}`}>
              {hasOpen && <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#c0392b]" />}
              {s.label}
            </button>
          );
        })}
      </div>

      {ready && !fan && (
        <div className="glass mb-6 p-4 text-sm text-[#3a3f52]">Connect your Freighter wallet (top right) to vote.</div>
      )}

      {!round ? (
        <div className="glass p-8 text-center">
          <div className="font-display text-xl text-[#23252f]">{CATEGORY_LABEL[activeCat]} isn’t open yet</div>
          <p className="mt-2 text-sm text-[#7a7768]">Voting for this stage opens when the organizer starts its round. Try another stage above.</p>
        </div>
      ) : (
        <>
          <SpotlightCarousel slides={slides} onSelect={setPicked} selectedId={picked} cta="Pick" />
          <div className="mt-8 flex flex-col items-center gap-3">
            <button className="btn-gold" disabled={busy || !fan || !picked || round.status !== "open"} onClick={cast}>
              {busy ? "Submitting..." : round.status !== "open" ? "Voting closed for this stage" : picked ? `Vote in ${CATEGORY_LABEL[activeCat]}` : "Select a contestant"}
            </button>
            <Link href="/verify" className="text-sm text-[#7a7768] underline-offset-4 hover:underline">Already voted? Verify your receipt</Link>
          </div>
        </>
      )}

      {/* Live totals */}
      {board && board.contestants.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-[#23252f]">Live tally</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#7a7768]">{board.total.toLocaleString()} votes</span>
              <Link href="/leaderboard" className="text-sm text-[#a97f16] hover:underline">Full leaderboard →</Link>
            </div>
          </div>
          <div className="space-y-2">
            {board.contestants.slice(0, 6).map((r) => (
              <div key={r.id} className="glass flex items-center gap-3 p-3">
                <div className="flex w-28 shrink-0 items-center gap-1.5 truncate text-sm text-[#23252f]"><Flag sash={r.sash} /> {r.name}</div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#efe9d8]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8912f] transition-all duration-500" style={{ width: `${Math.round((r.votes / maxVotes) * 100)}%` }} />
                </div>
                <div className="w-12 shrink-0 text-right font-display text-sm font-semibold text-[#b8912f]">{r.votes.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Toast msg={toast.msg} tone={toast.tone} />
    </div>
  );
}
