"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Portrait } from "@/components/Portrait";
import { Flag } from "@/components/Flag";

type Row = { id: string; name: string; country: string; sash: string; portraitUrl: string | null; votes: number; rank: number };
type Board = { roundId: string | null; roundTitle: string | null; status: string | null; verified: boolean; total: number; contestants: Row[] };

type LoadState = "loading" | "ready" | "error";

export default function LeaderboardPage() {
  const [board, setBoard] = useState<Board | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [pulse, setPulse] = useState(false);
  const firstLoad = useRef(true);

  async function load() {
    try {
      const r = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      const data: Board = await r.json();
      setBoard(data);
      setState("ready");
      if (!firstLoad.current) { setPulse(true); setTimeout(() => setPulse(false), 700); }
      firstLoad.current = false;
    } catch {
      setState((s) => (s === "ready" ? "ready" : "error")); // keep last good data on a transient poll failure
    }
  }

  useEffect(() => {
    load();
    const iv = setInterval(load, 8000); // real-time refresh
    return () => clearInterval(iv);
  }, []);

  const rows = board?.contestants ?? [];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">Live standings</div>
          <h1 className="font-display text-4xl font-semibold text-[#23252f] sm:text-5xl">Leaderboard</h1>
          <p className="mt-2 max-w-xl text-sm text-[#5f6172]">
            {board?.roundTitle
              ? <>Ranking for <b>{board.roundTitle}</b>. </>
              : <>No active round yet. </>}
            {board?.verified
              ? "Totals are from the anchored, tamper-evident tally."
              : "Updates every few seconds as votes come in."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {board?.status && (
            <span className={board.status === "open" ? "tag-on" : "tag-off"}>
              {board.status === "open" ? "Round open" : "Round closed"}
            </span>
          )}
          <span className={`flex items-center gap-1.5 text-xs text-[#7a7768] transition ${pulse ? "opacity-100" : "opacity-70"}`}>
            <span className={`inline-block h-2 w-2 rounded-full transition-transform ${board?.status === "open" ? "bg-emerald" : "bg-[#c9a227]"} ${pulse ? "scale-150" : "scale-100"}`} />
            Live
          </span>
        </div>
      </header>

      {/* Loading */}
      {state === "loading" && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass flex items-center gap-4 p-4">
              <div className="h-8 w-8 animate-pulse rounded-full bg-[#efe9d8]" />
              <div className="h-12 w-12 animate-pulse rounded-xl bg-[#efe9d8]" />
              <div className="flex-1"><div className="h-4 w-40 animate-pulse rounded bg-[#efe9d8]" /></div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div className="glass p-8 text-center">
          <div className="font-display text-xl text-[#23252f]">Couldn’t load the leaderboard</div>
          <p className="mt-2 text-sm text-[#7a7768]">Check your connection and try again.</p>
          <button onClick={load} className="btn-gold mt-4">Retry</button>
        </div>
      )}

      {/* Empty */}
      {state === "ready" && board && board.total === 0 && (
        <div className="glass p-10 text-center">
          <div className="font-display text-2xl text-[#23252f]">No votes yet</div>
          <p className="mt-2 text-sm text-[#7a7768]">Be the first to crown your queen.</p>
          <Link href="/vote" className="btn-gold mt-4 inline-block">Cast your vote</Link>
        </div>
      )}

      {/* Board */}
      {state === "ready" && board && board.total > 0 && (
        <ol className="space-y-3">
          {rows.map((r) => {
            const pct = Math.round((r.votes / board.total) * 100);
            const isTop = r.rank <= 3;
            return (
              <li key={r.id}>
                <Link href={`/contestants/${r.id}`}
                  className={`glass glass-hover flex items-center gap-4 p-4 ${isTop ? "ring-1 ring-gold/40" : ""}`}>
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-lg font-semibold ${
                    r.rank === 1 ? "bg-gradient-to-b from-[#d4af37] to-[#b8912f] text-[#1a1f35]" :
                    isTop ? "bg-[#faf0d2] text-[#8a6d1f]" : "surface-soft text-[#7a7768]"}`}>
                    {r.rank}
                  </div>
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                    <Portrait id={r.id} name={r.name} sash={r.sash} size="sm" portraitUrl={r.portraitUrl} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-lg font-semibold text-[#23252f]">{r.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-[#7a7768]"><Flag sash={r.sash} /> {r.country}</div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#efe9d8]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8912f] transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-2xl font-semibold text-[#b8912f]">{r.votes.toLocaleString()}</div>
                    <div className="text-[11px] uppercase tracking-wider text-[#7a7768]">{pct}%</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
