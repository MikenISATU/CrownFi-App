"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/session/SessionProvider";
import { NftCard } from "@/components/NftCard";
import { short } from "@/lib/format";
import { getJson } from "@/lib/api";

type Collectible = {
  id: string; title: string; priceUsdc: number; metadataUri: string;
  candidateId: number | null; edition: number; listingId: number | null;
  minted: number; perWallet: number; ownedByMe: boolean;
};
type Candidate = {
  contestant: { id: string; name: string; country: string; sash: string; portraitUrl: string | null; continent?: string; height?: string; nftUrl?: string | null } | null;
  stats: { votes: number; rank: number; totalContestants: number; totalVotes: number; roundId: string | null; roundTitle: string | null; status: string | null };
  collectibles: Collectible[];
  error?: string;
};

export default function CandidatePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { address } = useSession();

  const [data, setData] = useState<Candidate | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [balance, setBalance] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const r = await fetch(`/api/contestants/${id}`, { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      const d: Candidate = await r.json();
      setData(d);
      setState(d.contestant ? "ready" : "error");
    } catch {
      setState("error");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const refreshBalance = useCallback(() => {
    if (address) getJson<{ balanceUsdc: number }>(`/api/usdc-balance?address=${address}`, { balanceUsdc: 0 }).then((b) => setBalance(b.balanceUsdc));
    else setBalance(null);
  }, [address]);
  useEffect(refreshBalance, [refreshBalance]);

  if (state === "loading") {
    return <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4"><div className="h-10 w-2/3 animate-pulse rounded bg-[#efe9d8]" /><div className="h-40 w-full animate-pulse rounded-2xl bg-[#efe9d8]" /></div>
      <div className="aspect-[5/4] w-full animate-pulse rounded-2xl bg-[#efe9d8]" />
    </div>;
  }
  if (state === "error" || !data?.contestant) {
    return <div className="glass p-10 text-center">
      <div className="font-display text-2xl text-[#23252f]">Candidate not found</div>
      <Link href="/contestants" className="btn-gold mt-4 inline-block">Back to collectibles</Link>
    </div>;
  }

  const c = data.contestant;
  const s = data.stats;
  const col = data.collectibles[0];
  const firstName = c.name.split(" ")[0];

  return (
    <div className="space-y-10">
      <Link href="/leaderboard" className="text-sm text-[#7a7768] hover:text-[#23252f]">← Back to leaderboard</Link>

      <div className="grid items-center gap-10 lg:grid-cols-2">
        {/* Left: support copy + mint */}
        <div>
          <div className="eyebrow mb-3">Exclusive drop</div>
          <h1 className="tracking-tight text-5xl font-semibold text-[#c8a233] sm:text-6xl">Support Your Queen</h1>
          <p className="mt-5 max-w-lg text-[#5f6172]">
            Every official candidate portrait is prepared as a digital collectible on Base. The contract and metadata are ready;
            public checkout and owner-authorized minting are not released yet.
          </p>
          <p className="mt-3 max-w-lg text-sm text-[#7a7768]">
            You can review the candidate now and return when CrownFi opens the collection.
          </p>

          {col && (
            <>
              <div className="mt-6 flex flex-wrap gap-8 border-y border-[#eee6d3] py-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#7a7768]">Network</div>
                  <div className="mt-0.5 flex items-center gap-1.5 font-display text-lg text-[#23252f]"><span className="inline-block h-2 w-2 rounded-full bg-emerald" /> Base Sepolia</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#7a7768]">Price</div>
                  <div className="mt-0.5 font-display text-lg text-[#23252f]">To be announced</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#7a7768]">Supply</div>
                  <div className="mt-0.5 font-display text-lg text-[#23252f]">Contract configured</div>
                  <div className="text-[10px] text-[#9a968b]">{col.minted} minted so far</div>
                </div>
              </div>

              {/* Wallet status */}
              <div className="mt-4 rounded-xl surface-soft px-3 py-2 text-xs">
                {address
                  ? <span className="text-[#5f6172]">Wallet <span className="mono text-[#23252f]">{short(address, 5)}</span>{balance != null && <> · <span className="text-[#a97f16]">{balance.toFixed(2)} USDC</span></>}</span>
                  : <span className="text-[#7a7768]">No wallet connected.</span>}
              </div>

              <div className="mt-5 rounded-2xl border border-[#e6d59c] bg-[#faf6ea] p-4">
                <span className="tag-off">Coming soon</span>
                <p className="mt-2 text-sm leading-relaxed text-[#5f6172]">
                  CrownFi is not accepting collectible payments or mint requests yet. No wallet approval is needed on this page.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/vote" className="btn-gold">Vote for {firstName}</Link>
                  <Link href="/funds" className="btn-ghost">Get Base test assets</Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: the floating collectible card */}
        <div className="space-y-5">
          {c.nftUrl ? (
            <div className="animate-float [transform-style:preserve-3d]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.nftUrl} alt={`${c.name} collectible`} className="w-full rounded-2xl shadow-[0_45px_90px_-30px_rgba(184,145,47,0.75)]" />
            </div>
          ) : (
            <div className="animate-float">
              <NftCard
                name={c.name}
                country={c.country}
                sash={c.sash}
                continent={c.continent ?? "Asia"}
                height={c.height ?? "—"}
                photo={c.portraitUrl}
                edition={col?.candidateId ?? 1}
                supply={1}
                tokenId={undefined}
              />
            </div>
          )}
          {/* Live stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass p-4 text-center">
              <div className="font-display text-3xl font-semibold text-[#b8912f]">#{s.rank || "—"}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-[#7a7768]">Rank</div>
            </div>
            <div className="glass p-4 text-center">
              <div className="font-display text-3xl font-semibold text-[#b8912f]">{s.votes.toLocaleString()}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-[#7a7768]">Votes</div>
            </div>
            <div className="glass p-4 text-center">
              <div className="font-display text-3xl font-semibold text-[#b8912f]">{s.totalVotes ? Math.round((s.votes / s.totalVotes) * 100) : 0}%</div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-[#7a7768]">Share</div>
            </div>
          </div>
          <Link href="/vote" className="btn-ghost w-full text-center">Vote for {firstName}</Link>
        </div>
      </div>

    </div>
  );
}
