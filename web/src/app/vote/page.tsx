"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@/session/SessionProvider";
import { SpotlightCarousel, Slide } from "@/components/Carousel";
import { Toast } from "@/components/ui";
import { getJson, postJson } from "@/lib/api";
import { Flag } from "@/components/Flag";
import { Icons } from "@/components/icons";
import { messageFor } from "@/lib/messages";
import { PAGEANT_SEGMENTS, CATEGORY_LABEL } from "@/lib/segments";

type Round = { id: string; title: string; status: string; category: string | null };
type TallyRow = { id: string; name: string; sash: string; votes: number };
type Board = { total: number; contestants: TallyRow[] };

export default function VotePage() {
  const { fan, ready, connect, connecting } = useSession();
  const [cons, setCons] = useState<any[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [activeCat, setActiveCat] = useState<string>(PAGEANT_SEGMENTS[0].key);
  const [picked, setPicked] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [board, setBoard] = useState<Board | null>(null);
  const [myVotes, setMyVotes] = useState<Record<string, string>>({}); // roundId → contestantId
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" }>({ msg: "", tone: "ok" });

  // The round you vote in = the open round for the selected category (else its latest round).
  const round = useMemo(() => {
    const inCat = rounds.filter((r) => r.category === activeCat);
    return inCat.find((r) => r.status === "open") ?? inCat[0] ?? null;
  }, [rounds, activeCat]);

  // Live standings for THIS stage's round — feeds the cards and the tally below.
  const loadTotals = useCallback(() => {
    const url = round ? `/api/leaderboard?roundId=${round.id}` : "/api/leaderboard";
    getJson<Board | null>(url, null).then((b) => b && setBoard(b));
  }, [round?.id]);

  // votes + rank per candidate, so the carousel can inform the choice, not just display it.
  const voteInfo = useMemo(() => {
    const map = new Map<string, { votes: number; rank: number; pct: number }>();
    const rows = board?.contestants ?? [];
    rows.forEach((r, i) => map.set(r.id, { votes: r.votes, rank: i + 1, pct: board!.total > 0 ? Math.round((r.votes / board!.total) * 100) : 0 }));
    return map;
  }, [board]);

  // Category-specific candidate photos with fallback to the base portrait.
  const slides: Slide[] = useMemo(() => cons.map((c: any) => {
    const slug = String(c.country || c.sash).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const info = voteInfo.get(c.id);
    return {
      id: c.id, name: c.name, country: c.country, sash: c.sash,
      portraitUrl: `/candidates/${activeCat}/${slug}.webp`,
      fallbackUrl: c.portraitUrl ?? `/candidates/${slug}.webp`,
      meta: info ? { votes: info.votes, rank: info.rank, pct: info.pct } : undefined,
      profileHref: `/contestants/${c.id}`,
    };
  }), [cons, activeCat, voteInfo]);

  // What this wallet has already voted for, keyed by round.
  const loadMyVotes = useCallback(async () => {
    if (!fan) { setMyVotes({}); return; }
    const d = await getJson<{ votes: { roundId: string; contestantId: string }[] }>("/api/vote", { votes: [] });
    setMyVotes(Object.fromEntries(d.votes.map((v) => [v.roundId, v.contestantId])));
  }, [fan]);
  useEffect(() => { loadMyVotes(); }, [loadMyVotes]);

  useEffect(() => {
    getJson<any[]>("/api/contestants", [], { ttl: 60_000 }).then(setCons);
    getJson<Round[]>("/api/rounds", [], { ttl: 30_000 }).then(setRounds);
  }, []);

  useEffect(() => {
    loadTotals();
    const iv = setInterval(loadTotals, 8000); // live vote totals for the stage on screen
    return () => clearInterval(iv);
  }, [loadTotals]);

  // Stages this wallet has already voted in (checkmarks on the pills).
  const votedCats = useMemo(() => {
    const set = new Set<string>();
    for (const r of rounds) if (r.category && myVotes[r.id]) set.add(r.category);
    return set;
  }, [rounds, myVotes]);

  const votedFor = round ? myVotes[round.id] ?? "" : "";
  useEffect(() => { setPicked(votedFor); }, [votedFor, activeCat]);

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
    if (ok) { flash(`Vote recorded (+${(data as any)?.pointsAwarded ?? 0} points). Verify it once the round closes.`, "ok"); loadTotals(); loadMyVotes(); }
    else flash(messageFor(err, "Could not record your vote."), "err");
  }

  const pickedSlide = slides.find((s) => s.id === picked);
  const canCast = Boolean(fan && round && round.status === "open" && picked && !votedFor);
  const currentStep = !round ? 1 : !picked && !votedFor ? 2 : 3;

  return (
    <div>
      <div className="mb-6">
        <div className="eyebrow mb-2">Cast your vote</div>
        <h1 className="tracking-tight text-4xl font-semibold text-[#23252f]">Who wears the <span className="font-display italic text-[#c8a233]">crown</span>?</h1>
        <p className="mt-2 max-w-xl text-sm text-[#5f6172]">
          Pick a stage, crown your queen — one vote per wallet, per round. Closed rounds are prepared for anchoring on Base, so
          every tally can be verified.
        </p>
        <p className="mt-2 text-sm text-[#5f6172]">
          {round
            ? <>{round.title} · {round.status}{board ? <> · <span className="tabular-nums">{board.total.toLocaleString()}</span> votes so far</> : null}</>
            : "Not open for voting yet"}
          <span className="tag-off ml-2">off-chain intake</span>
        </p>
      </div>

      <section className="glass mb-6 grid overflow-hidden sm:grid-cols-3" aria-label="Voting progress">
        {[
          { n: 1, title: "Choose a stage", detail: CATEGORY_LABEL[activeCat] },
          { n: 2, title: "Select a candidate", detail: pickedSlide?.name ?? "Browse the lineup" },
          { n: 3, title: "Confirm once", detail: votedFor ? "Vote recorded" : fan ? "Wallet ready" : "Connect your wallet" },
        ].map((step) => {
          const complete = currentStep > step.n || Boolean(votedFor && step.n < 3);
          const active = currentStep === step.n;
          return (
            <div key={step.n} className={`flex items-center gap-3 px-4 py-3.5 ${step.n > 1 ? "border-t border-[#eee6d3] sm:border-l sm:border-t-0" : ""} ${active ? "bg-[#faf6ea]" : ""}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${complete ? "bg-[#0f6e56] text-white" : active ? "bg-[#1a1f35] text-[#f4c84e] ring-4 ring-[#d4af37]/15" : "bg-[#efe9d8] text-[#8a8779]"}`}>
                {complete ? <Icons.Check size={14} strokeWidth={3} /> : `0${step.n}`}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#23252f]">{step.title}</span>
                <span className="block truncate text-xs text-[#8a8779]">{step.detail}</span>
              </span>
            </div>
          );
        })}
      </section>

      {/* Pageant stages — red dot = open now, gold check = you've voted there. */}
      <div className="-mx-1 mb-8 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar" aria-label="Pageant stages">
        {PAGEANT_SEGMENTS.map((s) => {
          const hasOpen = rounds.some((r) => r.category === s.key && r.status === "open");
          const active = activeCat === s.key;
          const voted = votedCats.has(s.key);
          return (
            <button key={s.key} onClick={() => { setActiveCat(s.key); setPicked(""); }} aria-pressed={active}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${active ? "border-transparent bg-gradient-to-b from-[#d4af37] to-[#b8912f] text-[#1a1f35]" : "border-[#e7e2d3] bg-white text-[#5f6172] hover:border-[#c9a227]"}`}>
              {hasOpen && !voted && <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#c0392b]" />}
              {s.label}
              {voted && <Icons.Check size={13} strokeWidth={3} className={active ? "text-[#1a1f35]" : "text-[#0f6e56]"} aria-label="You voted in this stage" />}
            </button>
          );
        })}
      </div>

      {ready && !fan && (
        <div className="card-gold mb-6 flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3 text-sm text-[#3a3f52]">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#1a1f35] text-[#f4c84e]"><Icons.Wallet size={17} strokeWidth={1.8} /></span>
            <span><b className="block text-[#23252f]">Connect when you’re ready to confirm</b><span className="text-xs text-[#7a7768]">Use Base Account or MetaMask. You can browse every candidate first.</span></span>
          </div>
          <button className="btn-gold shrink-0" onClick={connect} disabled={connecting}>{connecting ? "Connecting…" : "Connect wallet"}</button>
        </div>
      )}

      {/* Loading — reserve the carousel's space so nothing jumps in. */}
      {cons.length === 0 && (
        <div className="flex items-center justify-center gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`glass p-2 ${i === 1 ? "w-72 sm:w-96" : "hidden w-44 sm:block sm:w-60"}`}>
              <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-[#efe9d8]" />
              <div className="mx-auto mt-3 h-4 w-28 animate-pulse rounded bg-[#efe9d8]" />
              <div className="mx-auto mb-1 mt-2 h-3 w-16 animate-pulse rounded bg-[#efe9d8]" />
            </div>
          ))}
        </div>
      )}

      {cons.length > 0 && (!round ? (
        <div className="glass p-8 text-center">
          <div className="font-display text-xl text-[#23252f]">{CATEGORY_LABEL[activeCat]} isn’t open yet</div>
          <p className="mt-2 text-sm text-[#7a7768]">Voting for this stage opens when the organizer starts its round. Try another stage above.</p>
        </div>
      ) : (
        <>
          <SpotlightCarousel
            slides={slides}
            onSelect={votedFor ? undefined : setPicked}
            selectedId={picked}
            votedId={votedFor}
            cta="Pick"
            ariaLabel={`${CATEGORY_LABEL[activeCat]} candidates`}
          />
          <div className="mt-8 flex flex-col items-center gap-3">
            {votedFor ? (
              <>
                <div className="flex items-center gap-2 rounded-xl border border-[#c9eadc] bg-[#e6f6ef] px-4 py-2.5 text-sm font-semibold text-[#0f6e56]">
                  <Flag sash={pickedSlide?.sash} className="!h-4 !w-6" /> You voted for {pickedSlide?.name ?? "your candidate"} in {CATEGORY_LABEL[activeCat]}.
                </div>
                <Link href="/verify" className="text-sm text-[#7a7768] underline-offset-4 hover:underline">Verify your receipt</Link>
              </>
            ) : (
              <>
                {pickedSlide ? (
                  <div className="glass flex w-full max-w-xl items-center gap-3 p-3.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#faf0d2]"><Flag sash={pickedSlide.sash} className="!h-4 !w-6" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold uppercase tracking-wider text-[#9a968b]">Your selection</span><b className="block truncate text-sm text-[#23252f]">{pickedSlide.name} · {CATEGORY_LABEL[activeCat]}</b></span>
                    <button className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#a97f16] transition hover:bg-[#faf6ea]" onClick={() => setPicked("")}>Change</button>
                  </div>
                ) : <div className="text-sm text-[#7a7768]">Select a contestant above — you’ll review the choice before confirming.</div>}
                <Link href="/verify" className="text-sm text-[#7a7768] underline-offset-4 hover:underline">Already voted? Verify your receipt</Link>
              </>
            )}
          </div>
        </>
      ))}

      {/* Live totals for this stage */}
      {board && board.contestants.length > 0 && board.total > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="tracking-tight text-2xl font-semibold text-[#23252f]">Live tally</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm tabular-nums text-[#7a7768]">{board.total.toLocaleString()} votes</span>
              <Link href="/leaderboard" className="text-sm text-[#a97f16] hover:underline">Full leaderboard →</Link>
            </div>
          </div>
          <div className="space-y-2">
            {board.contestants.slice(0, 6).map((r, index) => (
              <div key={r.id} className="glass flex items-center gap-3 p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#faf6ea] text-xs font-semibold tabular-nums text-[#a97f16]">{index + 1}</span>
                <div className="flex w-32 shrink-0 items-center gap-1.5 truncate text-sm text-[#23252f]"><Flag sash={r.sash} /> {r.name}</div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#efe9d8]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8912f] transition-all duration-500" style={{ width: `${Math.round((r.votes / board.total) * 100)}%` }} />
                </div>
                <div className="w-16 shrink-0 text-right"><span className="block font-display text-sm font-semibold tabular-nums text-[#b8912f]">{Math.round((r.votes / board.total) * 100)}%</span><span className="block text-[10px] tabular-nums text-[#9a968b]">{r.votes.toLocaleString()} votes</span></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sticky confirm bar — the single primary action, always reachable once a pick is made. */}
      {canCast && pickedSlide && (
        <div className="fixed inset-x-0 bottom-20 z-40 px-4 sm:bottom-6">
          <div className="glass mx-auto flex max-w-xl items-center justify-between gap-3 p-3 shadow-[0_24px_50px_-20px_rgba(120,100,40,0.5)]">
            <div className="min-w-0 text-sm text-[#5f6172]">
              <span className="flex items-center gap-1.5"><Flag sash={pickedSlide.sash} className="!h-4 !w-6" /> Voting for <b className="truncate text-[#23252f]">{pickedSlide.name}</b></span>
              <span className="hidden sm:inline"> in {CATEGORY_LABEL[activeCat]}</span>
            </div>
            <button className="btn-gold shrink-0" disabled={busy} onClick={cast}>
              {busy ? "Submitting…" : "Confirm vote"}
            </button>
          </div>
        </div>
      )}

      <Toast msg={toast.msg} tone={toast.tone} />
    </div>
  );
}
