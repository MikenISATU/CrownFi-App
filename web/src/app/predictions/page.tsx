"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseEventLogs, type Address } from "viem";
import { usePublicClient } from "wagmi";
import { useSession } from "@/session/SessionProvider";
import { MarketCard, MarketView, CATEGORY_LABEL } from "@/components/MarketCard";
import { MARKET_CATEGORIES } from "@/lib/segments";
import { Icons } from "@/components/icons";
import { MarketCandidateHint, MAX_MARKET_OPTIONS, withCandidateFlags } from "@/lib/markets";
import { TestnetFundingPanel } from "@/components/TestnetFundingPanel";
import { TestnetNotice } from "@/components/TestnetNotice";
import { MarketCloseField } from "@/components/MarketCloseField";
import { BannerUpload } from "@/components/BannerUpload";
import { Toast } from "@/components/ui";
import { messageFor } from "@/lib/messages";
import { baseContracts } from "@/base/contracts";
import { predictionMarketAbi } from "@/base/abis";
import { useBaseWalletClient } from "@/base/useBaseWalletClient";
import { BaseWalletConnect } from "@/base";

const CATEGORIES = ["all", ...MARKET_CATEGORIES.map((s) => s.key)];
const STATUSES = [
  { key: "active", label: "Active" },
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "previous", label: "Previous" },
  { key: "cancelled", label: "Cancelled" },
];

export default function PredictionsLanding() {
  const { fan, address, isAdmin, connecting } = useSession();
  const router = useRouter();
  const publicClient = usePublicClient();
  const getWalletClient = useBaseWalletClient();
  const [markets, setMarkets] = useState<MarketView[] | null>(null);
  const [candidates, setCandidates] = useState<MarketCandidateHint[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("active");
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState({ msg: "", tone: "ok" as "ok" | "err" });
  const flash = (msg: string, tone: "ok" | "err" = "ok") => {
    setToast({ msg, tone });
    setTimeout(() => setToast({ msg: "", tone: "ok" }), 3600);
  };

  function openCreator() {
    // Always reveal a useful surface. Signed-out users get the complete wallet chooser
    // instead of an implicit connector attempt that can appear to do nothing.
    setShowCreate((open) => !open);
  }

  function load() {
    fetch("/api/markets", { cache: "no-store" }).then((r) => r.json()).then((d) => setMarkets(Array.isArray(d) ? d : [])).catch(() => setMarkets([]));
  }
  useEffect(() => {
    load();
    fetch("/api/contestants").then((r) => r.json()).then((d) => setCandidates(Array.isArray(d) ? d : [])).catch(() => setCandidates([]));
    // Live pools — but don't hammer the API when the tab isn't being looked at.
    const iv = setInterval(() => { if (document.visibilityState === "visible") load(); }, 15000);
    return () => clearInterval(iv);
  }, []);

  const filtered = useMemo(() => {
    if (!markets) return [];
    return markets.map((m) => withCandidateFlags(m, candidates)).filter((m) => {
      if (cat !== "all" && m.category !== cat) return false;
      if (status === "active" && m.status !== "open") return false;
      if (status === "live" && !m.live) return false;
      if (status === "upcoming" && !(m.status === "open" && !m.live)) return false;
      if (status === "previous" && !["closed", "resolved", "cancelled"].includes(m.status)) return false;
      if (status === "cancelled" && m.status !== "cancelled") return false;
      if (q && !m.question.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [markets, cat, status, q]);

  const activeMarkets = markets?.filter((m) => m.status === "open") ?? [];
  const live = (markets ?? []).map((m) => withCandidateFlags(m, candidates)).filter((m) => m.live).sort((a, b) => (b.official ? 1 : 0) - (a.official ? 1 : 0));
  const bannerMarket = activeMarkets.find((m) => m.bannerUrl);

  return (
    <div className="space-y-8">
      <TestnetNotice />
      {bannerMarket?.bannerUrl && (
          <div className="overflow-hidden rounded-[28px] border border-[#d4af37]/60 bg-[#050a4f] shadow-[0_24px_60px_-38px_rgba(5,10,79,0.8)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerMarket.bannerUrl}
              alt={`${bannerMarket.question} market banner`}
              className="h-48 w-full object-cover sm:h-64 lg:h-72"
            />
          </div>
        )}
      <header className="relative z-30 isolate rounded-[28px] border border-[#d4af37]/60 bg-[#050a4f] px-5 py-8 text-white shadow-[0_28px_70px_-42px_rgba(0,0,200,0.75)] sm:px-8 sm:py-10">
        <div aria-hidden className="absolute inset-0 -z-10 rounded-[28px] bg-[radial-gradient(circle_at_85%_12%,rgba(0,2,253,0.48),transparent_38%),linear-gradient(125deg,rgba(0,0,200,0.2),transparent_48%)]" />
        <div aria-hidden className="absolute right-4 top-4 -z-10 h-40 w-40 rounded-full border border-white/15 shadow-[0_0_80px_rgba(0,2,253,0.38)]" />
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f2d784]/60 bg-[#f2d784]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f2d784]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0002fd] shadow-[0_0_0_4px_rgba(0,2,253,0.24)]" />
              Prediction markets on Base
            </div>
            <h1 className="max-w-3xl tracking-tight text-4xl font-semibold text-white sm:text-5xl">Predict the <span className="font-display italic text-[#f2d784]">crown</span></h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">Every signed-in fan can place a prediction with test USDC. Browse freely, connect only when you stake, and confirm each position in your own wallet.</p>
            <p className="mt-2 text-xs text-white/55">Any signed-in fan can open a community market. Closing, cancellation, and settlement remain admin-controlled for verifiable outcomes.</p>
          {markets !== null && markets.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-medium text-white/85 tabular-nums backdrop-blur">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c0392b] opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#c0392b]" />
                </span>
                {activeMarkets.filter((m) => m.live).length} live
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-medium text-white/85 tabular-nums backdrop-blur">{activeMarkets.reduce((s, m) => s + m.totalPool, 0).toLocaleString()} USDC pooled</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-medium text-white/85 tabular-nums backdrop-blur">{activeMarkets.reduce((s, m) => s + m.participants, 0)} predicting</span>
            </div>
          )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="btn-gold min-h-[52px] min-w-[230px] px-7 text-sm uppercase tracking-[0.09em]"
              onClick={() => void openCreator()}
              disabled={connecting}
            >
              {connecting ? "Connecting…" : showCreate ? "Close creator" : "Create a prediction"}
            </button>
            {isAdmin && <Link className="btn-ghost !border-white/25 !bg-white/10 !text-white hover:!border-[#f2d784] hover:!bg-white/15" href="/admin">Manage markets</Link>}
          </div>
        </div>
      </header>

      {showCreate && (
        fan ? (
          <CreateMarket
            address={address}
            publicClient={publicClient}
            getWalletClient={getWalletClient}
            onCreated={(id) => router.push(`/predictions/${id}`)}
            onError={(message) => flash(message, "err")}
          />
        ) : (
          <section className="page-surface scroll-mt-24 p-5 sm:p-7" aria-labelledby="connect-to-create-title">
            <div className="eyebrow mb-2">Community market</div>
            <h2 id="connect-to-create-title" className="tracking-tight text-2xl font-semibold text-[#23252f] sm:text-3xl">Connect to create</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5f6172]">Choose Base Account, Coinbase Wallet, MetaMask, or email. Every signed-in testnet user can open a prediction market.</p>
            <div className="mt-5 flex items-center gap-3"><BaseWalletConnect menuAlign="left" /></div>
          </section>
        )
      )}

      <TestnetFundingPanel compact />

      {/* How it works — numbered walk-through, reference-style */}
      <p className="-mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 sm:hidden">Swipe through the four steps →</p>
      <section aria-label="How prediction markets work" className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {[
          { n: "01", t: "Pick a market", d: "Each pageant stage gets a market. The percentages are live odds — the crowd's money talking." },
          { n: "02", t: "Stake USDC", d: "Back an outcome with test USDC. You approve every stake in your own wallet; funds sit in the contract." },
          { n: "03", t: "Watch it move", d: "Odds shift as fans take sides. Change your mind? Cancel any position before close for a full refund." },
          { n: "04", t: "Claim winnings", d: "When the result is resolved on-chain, winners split the whole pool. Fee is 2% of profit only." },
        ].map((s) => (
          <div key={s.n} className="card-gold min-w-[82vw] snap-center p-5 sm:min-w-0">
            <div className="font-display text-sm font-semibold tabular-nums text-[#a97f16]">{s.n}</div>
            <div className="mt-1 font-display text-2xl font-semibold text-[#23252f]">{s.t}</div>
            <p className="mt-2 text-xs leading-relaxed text-[#5f6172]">{s.d}</p>
          </div>
        ))}
      </section>

      {/* Search + filters (sticky so they stay reachable while scrolling the grid) */}
      <div id="market-list" className="sticky top-2 z-20 -mx-2 scroll-mt-24 space-y-3 rounded-2xl border border-[#d4af37]/55 bg-white px-3 py-3 shadow-[0_20px_48px_-34px_rgba(0,0,0,0.72)] sm:top-3">
        <div className="relative">
          <Icons.Search size={16} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9a968b]" />
          <input className="field !pl-9" placeholder="Search markets…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search markets" />
          {q && <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#9a968b] hover:text-[#23252f]"><Icons.X size={14} strokeWidth={2} /></button>}
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 no-scrollbar">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${cat === c ? "border-[#a97f16]/40 bg-gradient-to-b from-[#e4c358] to-[#c39a2c] text-[#1a1f35] shadow-sm" : "border-[#e7e2d3] bg-white text-[#5f6172] hover:border-[#c9a227]"}`}>
              {c === "all" ? "All categories" : (CATEGORY_LABEL[c] ?? c)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {STATUSES.map((s) => (
            <button key={s.key} onClick={() => setStatus(s.key)} aria-pressed={status === s.key} className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${status === s.key ? "border-[#d4af37] bg-[#050a4f] text-[#f4e3a1]" : "border-[#e0e2f2] bg-white text-[#5f6172] hover:border-[#0000c8] hover:text-[#0000c8]"}`}>
              {s.label}
            </button>
          ))}
          {markets !== null && <span className="ml-auto text-xs tabular-nums text-[#9a968b]">{filtered.length} market{filtered.length === 1 ? "" : "s"}</span>}
        </div>
      </div>

      {/* Loading — card-shaped skeletons (reserve space to avoid layout shift) */}
      {markets === null && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass overflow-hidden">
              <div className="h-24 w-full animate-pulse bg-[#efe9d8]" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-[#efe9d8]" />
                <div className="h-2 w-full animate-pulse rounded bg-[#efe9d8]" />
                <div className="h-2 w-2/3 animate-pulse rounded bg-[#efe9d8]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Featured live */}
      {markets !== null && status === "active" && cat === "all" && !q && live.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 tracking-tight text-2xl font-semibold text-white">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c0392b] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c0392b]" />
            </span>
            Live now
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {live.slice(0, 3).map((m) => <MarketCard key={m.id} m={m} />)}
          </div>
        </section>
      )}

      {/* All (filtered) */}
      {markets !== null && (
        <section>
          {cat === "all" && !q && <h2 className="mb-3 tracking-tight text-2xl font-semibold text-white">{status === "previous" ? "Previous markets" : status === "cancelled" ? "Cancelled markets" : status === "active" ? "Active markets" : `${STATUSES.find((s) => s.key === status)?.label ?? "Markets"} markets`}</h2>}
          {filtered.length === 0 ? (
            <div className="glass p-10 text-center">
              <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full surface-soft text-[#a97f16]"><Icons.Search size={20} strokeWidth={1.75} /></div>
              {q || cat !== "all" || status !== "active" ? (
                <>
                  <div className="font-display text-xl text-[#23252f]">No markets match your filters</div>
                  <p className="mt-2 text-sm text-[#7a7768]">Try a different category or clear your search.</p>
                  <button onClick={() => { setQ(""); setCat("all"); setStatus("active"); }} className="btn-ghost mt-4">Clear filters</button>
                </>
              ) : (
                <>
                  <div className="font-display text-xl text-[#23252f]">No markets yet</div>
                  <p className="mt-2 text-sm text-[#7a7768]">Be the first to open a community prediction market.</p>
                  <button onClick={() => setShowCreate(true)} className="btn-gold mt-4">Create a prediction</button>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((m) => <MarketCard key={m.id} m={m} />)}
            </div>
          )}
        </section>
      )}

      <Toast msg={toast.msg} tone={toast.tone} />
    </div>
  );
}

function CreateMarket({
  address,
  publicClient,
  getWalletClient,
  onCreated,
  onError,
}: {
  address: string | null;
  publicClient: ReturnType<typeof usePublicClient>;
  getWalletClient: ReturnType<typeof useBaseWalletClient>;
  onCreated: (id: string) => void;
  onError: (message: string) => void;
}) {
  const defaultClose = () => new Date(Date.now() + 72 * 3_600_000).toISOString();
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState<string>(MARKET_CATEGORIES[0].key);
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [closeTime, setCloseTime] = useState(defaultClose);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isYesNo = category === "yes_no";
  const cleanOptions = options.map((option) => option.trim()).filter(Boolean);
  const valid = question.trim().length >= 3 && cleanOptions.length >= 2 && cleanOptions.length <= MAX_MARKET_OPTIONS && new Date(closeTime).getTime() > Date.now();

  function changeCategory(next: string) {
    setCategory(next);
    if (next === "yes_no") setOptions(["Yes", "No"]);
    else if (isYesNo) setOptions(["", ""]);
  }

  async function submit() {
    if (!valid || busy) return;
    if (!address || !publicClient || !baseContracts.predictionMarket) {
      onError("Connect a Base wallet before creating a market.");
      return;
    }
    setBusy(true);
    try {
      const marketDraft = { question: question.trim(), category, options: cleanOptions, closeTime, bannerUrl };
      const preflight = await fetch("/api/markets", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(marketDraft),
      });
      const preflightData = await preflight.json().catch(() => ({}));
      if (!preflight.ok) throw new Error(preflightData.error ?? "market_preflight_failed");

      const closeUnix = Math.floor(new Date(closeTime).getTime() / 1000);
      const simulation = await publicClient.simulateContract({
        address: baseContracts.predictionMarket,
        abi: predictionMarketAbi,
        functionName: "createMarket",
        args: [question.trim(), category, cleanOptions.length, BigInt(closeUnix)],
        account: address as Address,
      });
      const wallet = await getWalletClient(address);
      const txHash = await wallet.writeContract(simulation.request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") throw new Error("market_create_reverted");
      const events = parseEventLogs({ abi: predictionMarketAbi, logs: receipt.logs, eventName: "MarketCreated", strict: true });
      const chainMarketId = Number(events[0]?.args.marketId);
      if (!Number.isSafeInteger(chainMarketId) || chainMarketId <= 0) throw new Error("market_created_event_missing");

      const response = await fetch("/api/markets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...marketDraft, chainMarketId, createTxHash: txHash }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.id) throw new Error(data.error ?? "market_database_sync_failed");
      onCreated(data.id);
    } catch (error: any) {
      const raw = String(error?.shortMessage ?? error?.message ?? "");
      if (/rejected|denied|cancelled/i.test(raw)) onError("Wallet confirmation was cancelled.");
      else if (/insufficient funds|insufficient.*gas|exceeds balance/i.test(raw)) onError("You need Base Sepolia ETH for network gas before creating a market. Open Testnet funds, fund this wallet, then retry.");
      else if (/transaction_wallet_unavailable/i.test(raw)) onError("This account is signed in, but its transaction wallet is unavailable. Reconnect the same wallet and try again.");
      else if (/ownable|not owner|unauthorized/i.test(raw)) onError("The current Base contract still restricts creation to its owner. Update the deployed contract address to the community-enabled deployment.");
      else onError(messageFor(raw, "Could not create the Base market."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-surface scroll-mt-24 p-5 sm:p-7" aria-labelledby="create-market-title">
      <div className="mb-5">
        <div className="eyebrow mb-2">Community market</div>
        <h2 id="create-market-title" className="tracking-tight text-2xl font-semibold text-[#23252f] sm:text-3xl">Create a prediction market</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5f6172]">Your wallet opens the market on Base Sepolia. CrownFi admins verify the final result before settlement.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="lg:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold text-[#5f6172]">Prediction question</span>
          <input className="field" maxLength={300} placeholder="For example: Will the Philippines reach the final five?" value={question} onChange={(event) => setQuestion(event.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-[#5f6172]">Category</span>
          <select className="field" value={category} onChange={(event) => changeCategory(event.target.value)}>
            {MARKET_CATEGORIES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <MarketCloseField value={closeTime} onChange={setCloseTime} />
        <div className="space-y-2 lg:col-span-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5f6172]"><span>Outcomes</span><span>{cleanOptions.length} / {MAX_MARKET_OPTIONS}</span></div>
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-5 text-right text-xs text-[#9a968b]">{index + 1}</span>
              <input className="field" maxLength={120} readOnly={isYesNo} placeholder={`Outcome ${index + 1}`} value={option} onChange={(event) => setOptions((current) => current.map((value, i) => i === index ? event.target.value : value))} />
              {!isYesNo && options.length > 2 && <button type="button" aria-label={`Remove outcome ${index + 1}`} className="rounded-lg border border-[#e7e2d3] p-2 text-[#9a968b] hover:text-[#9f1239]" onClick={() => setOptions((current) => current.filter((_, i) => i !== index))}><Icons.X size={16} /></button>}
            </div>
          ))}
          {!isYesNo && options.length < MAX_MARKET_OPTIONS && <button type="button" className="text-sm font-semibold text-[#a97f16] hover:underline" onClick={() => setOptions((current) => [...current, ""])}>+ Add outcome</button>}
        </div>
        <div className="lg:col-span-2"><BannerUpload value={bannerUrl} onUploaded={setBannerUrl} /></div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button className="btn-gold min-w-48" disabled={!valid || busy} onClick={submit}>{busy ? "Confirming in wallet…" : "Create market on Base"}</button>
        <Link href="/funds" className="text-xs font-semibold text-[#0000c8] hover:underline">Need Base Sepolia ETH for gas?</Link>
        {!valid && <span className="text-xs text-[#9a968b]">Add a question, at least two outcomes, and a future closing time.</span>}
      </div>
    </section>
  );
}
