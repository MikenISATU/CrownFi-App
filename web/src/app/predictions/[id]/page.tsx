"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { parseUnits, type Address } from "viem";
import { usePublicClient } from "wagmi";
import Link from "next/link";
import { useSession } from "@/session/SessionProvider";
import { Toast } from "@/components/ui";
import { messageFor } from "@/lib/messages";
import { estimateReward, PLATFORM_FEE_PCT, withCandidateFlags, type MarketCandidateHint } from "@/lib/markets";
import { MarketView, CATEGORY_LABEL, statusBadge, timeLeft } from "@/components/MarketCard";
import { OddsChart } from "@/components/OddsChart";
import { Flag } from "@/components/Flag";
import { baseContracts } from "@/base/contracts";
import { erc20Abi, predictionMarketAbi } from "@/base/abis";
import { useBaseWalletClient } from "@/base/useBaseWalletClient";

type Detail = MarketView & {
  activity: { option: number; amount: number; createdAt: string; status: string }[];
  mine: { option: number; amount: number; status: string }[];
  series: { t: number; pcts: number[] }[];
};

let candidateHintsPromise: Promise<MarketCandidateHint[]> | null = null;
function candidateHints() {
  candidateHintsPromise ??= fetch("/api/contestants")
    .then((r) => r.json())
    .then((d) => Array.isArray(d) ? d : [])
    .catch(() => []);
  return candidateHintsPromise;
}

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const { fan, address, connect, connecting } = useSession();
  const publicClient = usePublicClient();
  const getWalletClient = useBaseWalletClient();
  const [m, setM] = useState<Detail | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [pick, setPick] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ msg: "", tone: "ok" as "ok" | "err" });
  const [tab, setTab] = useState<"activity" | "rules">("activity");
  const flash = (msg: string, tone: "ok" | "err" = "ok") => { setToast({ msg, tone }); setTimeout(() => setToast({ msg: "", tone: "ok" }), 3200); };

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const r = await fetch(`/api/markets/${id}`, { cache: "no-store" });
      if (!r.ok) throw new Error();
      const detail = await r.json() as Detail;
      setM(withCandidateFlags(detail, await candidateHints()));
      setState("ready");
    } catch { setState("error"); }
  }, [id]);

  // Same wallet balance the Collect and Tickets tabs show, so stakes are never a guess.
  const refreshBalance = useCallback(async () => {
    if (!address) { setBalance(null); return; }
    try {
      const r = await fetch(`/api/usdc-balance?address=${address}`, { cache: "no-store" });
      if (r.ok) setBalance((await r.json()).balanceUsdc ?? 0);
    } catch { /* leave the last known balance in place */ }
  }, [address]);
  useEffect(() => { refreshBalance(); }, [refreshBalance]);

  useEffect(() => { load(); const iv = setInterval(() => { if (document.visibilityState === "visible") load(); }, 10000); return () => clearInterval(iv); }, [load]);

  const reset = () => { setAmount(""); setPick(null); };

  async function predict() {
    if (!fan) { flash("Connect your wallet to predict.", "err"); return; }
    if (pick == null || !(Number(amount) > 0)) { flash("Pick an option and an amount.", "err"); return; }
    setBusy(true);
    try {
      const pr = await fetch(`/api/markets/${id}/prepare-stake`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ option: pick, amount: Number(amount) }) });
      const pd = await pr.json().catch(() => ({}));
      if (!pr.ok) { flash(stakeErr(pd.error), "err"); return; }
      if (!address || !publicClient || !baseContracts.predictionMarket || m?.chainMarketId == null) throw new Error("market_not_onchain");
      const wallet = await getWalletClient(address);
      const units = parseUnits(amount, 6);
      const allowance = await publicClient.readContract({
        address: baseContracts.usdc,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address as Address, baseContracts.predictionMarket],
      });
      if (allowance < units) {
        const approvalHash = await wallet.writeContract({
          address: baseContracts.usdc,
          abi: erc20Abi,
          functionName: "approve",
          args: [baseContracts.predictionMarket, units],
        });
        const approval = await publicClient.waitForTransactionReceipt({ hash: approvalHash });
        if (approval.status !== "success") throw new Error("approval_reverted");
      }
      const txHash = await wallet.writeContract({
        address: baseContracts.predictionMarket,
        abi: predictionMarketAbi,
        functionName: "stake",
        args: [BigInt(m.chainMarketId), pick, units],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") throw new Error("stake_reverted");
      const cr = await fetch(`/api/markets/${id}/confirm-stake`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ txHash, option: pick }) });
      const cd = await cr.json().catch(() => ({}));
      if (cr.ok) { flash(`Staked ${amount} USDC on-chain! +${cd.pointsAwarded ?? 0} points`); reset(); load(); refreshBalance(); }
      else flash(messageFor(cd.error, "Could not confirm your stake."), "err");
    } catch (error: any) {
      flash(transactionError(error, "Could not place the Base stake."), "err");
    } finally {
      setBusy(false);
    }
  }

  function stakeErr(code?: string): string {
    if (code && /balance|underfunded|insufficient/i.test(code)) return "Not enough test USDC — open Testnet funds, then try again.";
    return messageFor(code, "Could not start your prediction.");
  }

  // Cancel a position: withdraw the stake on `option` (on-chain unstake, refunds USDC).
  async function cancelPosition(option: number) {
    if (!fan) return;
    setBusy(true);
    try {
      const pr = await fetch(`/api/markets/${id}/prepare-unstake`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ option }) });
      const pd = await pr.json().catch(() => ({}));
      if (!pr.ok) { flash(messageFor(pd.error, "Could not start cancellation."), "err"); return; }
      // Legacy free-play market: the server already reversed the position.
      if (pd.mock) { flash("Position cancelled."); load(); refreshBalance(); return; }
      if (!address || !publicClient || !baseContracts.predictionMarket || m?.chainMarketId == null) throw new Error("market_not_onchain");
      const wallet = await getWalletClient(address);
      const txHash = await wallet.writeContract({ address: baseContracts.predictionMarket, abi: predictionMarketAbi, functionName: "unstake", args: [BigInt(m.chainMarketId), option] });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") throw new Error("unstake_reverted");
      const cr = await fetch(`/api/markets/${id}/confirm-unstake`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ txHash, option }) });
      const cd = await cr.json().catch(() => ({}));
      if (cr.ok) { flash("Position cancelled — USDC refunded to your wallet."); load(); refreshBalance(); }
      else flash(messageFor(cd.error, "Could not cancel your position."), "err");
    } catch (error: any) {
      flash(transactionError(error, "Could not cancel your position."), "err");
    } finally {
      setBusy(false);
    }
  }

  async function claim() {
    if (!fan) return;
    setBusy(true);
    try {
      const pr = await fetch(`/api/markets/${id}/prepare-claim`, { method: "POST" });
      const pd = await pr.json().catch(() => ({}));
      if (!pr.ok) { flash(messageFor(pd.error, "Could not start your claim."), "err"); return; }
      if (!address || !publicClient || !baseContracts.predictionMarket || m?.chainMarketId == null) throw new Error("market_not_onchain");
      const wallet = await getWalletClient(address);
      const txHash = await wallet.writeContract({ address: baseContracts.predictionMarket, abi: predictionMarketAbi, functionName: "claim", args: [BigInt(m.chainMarketId)] });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") throw new Error("claim_reverted");
      const cr = await fetch(`/api/markets/${id}/confirm-claim`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ txHash }) });
      const cd = await cr.json().catch(() => ({}));
      if (cr.ok) { flash("Winnings claimed to your wallet! 🎉"); load(); refreshBalance(); }
      else flash(messageFor(cd.error, "Could not claim your winnings."), "err");
    } catch (error: any) {
      flash(transactionError(error, "Could not claim your winnings."), "err");
    } finally {
      setBusy(false);
    }
  }

  async function refund() {
    if (!fan || !address || !publicClient || !baseContracts.predictionMarket || m?.chainMarketId == null) return;
    setBusy(true);
    try {
      const wallet = await getWalletClient(address);
      const txHash = await wallet.writeContract({ address: baseContracts.predictionMarket, abi: predictionMarketAbi, functionName: "refund", args: [BigInt(m.chainMarketId)] });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") throw new Error("refund_reverted");
      const response = await fetch(`/api/markets/${id}/confirm-refund`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ txHash }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "refund_confirm_failed");
      flash("Full refund claimed to your wallet.");
      load();
      refreshBalance();
    } catch (error: any) {
      flash(transactionError(error, "Could not claim the refund."), "err");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return <div className="glass h-64 animate-pulse" />;
  if (state === "error" || !m) return <div className="glass p-10 text-center"><div className="font-display text-2xl text-[#23252f]">Market not found</div><Link href="/predictions" className="btn-gold mt-4 inline-block">Back to markets</Link></div>;

  const badge = statusBadge(m);
  const canPredict = m.onchain && m.status === "open" && m.endsInMs > 0;
  const est = pick != null && Number(amount) > 0 ? estimateReward(m, pick, Number(amount)) : 0;

  // Exchange-style headline: the leading outcome's implied probability + its 24h move.
  const leader = [...m.options].sort((a, b) => b.percent - a.percent)[0];
  const closeAt = m.endsInMs > 0 ? new Date(Date.now() + m.endsInMs) : null;
  let delta24: number | null = null;
  if (leader && m.series.length >= 2) {
    const cutoff = Date.now() - 24 * 3600_000;
    const past = [...m.series].filter((s) => s.t <= cutoff).pop() ?? m.series[0];
    const pastPct = past?.pcts?.[leader.index];
    if (typeof pastPct === "number") delta24 = Math.round(leader.percent - pastPct);
  }
  // Plain-number risk summary for the order card: worst case, best case, and the exact fee.
  const amt = Number(amount) > 0 ? Number(amount) : 0;
  const grossIfWin = pick != null && amt > 0 ? (amt * (m.totalPool + amt)) / ((m.options[pick]?.pool ?? 0) + amt) : 0;
  const feeIfWin = Math.round(Math.max(0, grossIfWin - amt) * (PLATFORM_FEE_PCT / 100) * 100) / 100;

  return (
    <div className="space-y-6">
      <Link href="/predictions" className="text-sm text-[#7a7768] hover:text-[#23252f]">← All markets</Link>

      {m.status === "resolved" && m.winningOption != null && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-[#f2fbf7] px-5 py-3 text-sm">
          <span className="text-lg" aria-hidden>🏆</span>
          <span className="text-[#0f6e56]"><b>{m.options[m.winningOption]?.label}</b> won this segment.</span>
          <span className="ml-auto rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">Result anchored on-chain</span>
        </div>
      )}

      {m.status === "cancelled" && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#edc8d4] bg-[#fff6f8] px-5 py-3 text-sm text-[#881337]">
          <span aria-hidden>↩</span>
          <span><b>Market cancelled.</b> Every participant can claim a full on-chain refund.</span>
          <span className="ml-auto rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-[#edc8d4]">Kept for transparency</span>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* ══ LEFT: the market ══════════════════════════════ */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-[#faf0d2] px-2.5 py-0.5 font-semibold text-[#8a6d1f]">{CATEGORY_LABEL[m.category] ?? m.category}</span>
              <span className={`rounded-full px-2.5 py-0.5 font-semibold ${badge.cls}`}>{badge.label}</span>
            </div>
            <h1 className="mt-3 tracking-tight text-3xl font-semibold leading-tight text-[#23252f] sm:text-4xl">{m.question}</h1>
            {closeAt && m.status === "open" && (
              <div className="mt-2 text-xs text-[#7a7768]">
                Closes {closeAt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} local
                · {closeAt.toISOString().slice(0, 16).replace("T", " ")} UTC · {timeLeft(m.endsInMs)}
              </div>
            )}
          </div>

          {/* Market-says headline + chart */}
          <div className="glass p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9a968b]">Market says</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-5xl font-semibold tabular-nums text-[#23252f]">{leader?.percent ?? 0}%</span>
                  {delta24 != null && delta24 !== 0 && (
                    <span className={`text-sm font-semibold tabular-nums ${delta24 > 0 ? "text-emerald-600" : "text-[#9f1239]"}`}>
                      {delta24 > 0 ? "+" : ""}{delta24}% 24h
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-[#7a7768]">{leader?.label ?? "—"} implied probability</div>
              </div>
            </div>
            <div className="mt-4">
              <OddsChart series={m.series} labels={m.options.map((o) => o.label)} colors={CHART_COLORS} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label="Total pool" value={`${m.totalPool.toLocaleString()} USDC`} />
              <StatTile label="Participants" value={String(m.participants)} />
              <StatTile label="Options" value={String(m.options.length)} />
              <StatTile label="Leading" value={leader?.label ?? "—"} />
            </div>
          </div>

          {/* Outcomes table — the pool "book" */}
          <div>
            <div className="flex items-center gap-3 px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9a968b]">
              <span className="flex-1">Outcome</span>
              <span className="w-12 text-right">Chance</span>
              <span className="hidden w-20 text-right sm:block">Pool</span>
              <span className="w-16 text-right">To win</span>
            </div>
            <div className="space-y-1.5">
              {m.options.map((o) => {
                const won = m.status === "resolved" && m.winningOption === o.index;
                // Payout multiplier per 1 USDC if this option wins (lower share ⇒ higher multiplier).
                const mult = o.pool > 0 ? m.totalPool / o.pool : null;
                return (
                  <button key={o.index} onClick={() => canPredict && setPick(o.index)} disabled={!canPredict}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${pick === o.index ? "border-[#c9a227] bg-[#faf6ea]" : won ? "border-emerald-300 bg-emerald-50/50" : "border-[#eee6d3] bg-white"} ${canPredict ? "hover:border-[#c9a227]" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 truncate font-medium text-[#23252f]">
                        <Flag sash={o.sash ?? ""} /> {o.label}
                        {won && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">🏆 Winner</span>}
                      </span>
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#efe9d8]">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8912f]" style={{ width: `${o.percent}%` }} />
                      </div>
                    </div>
                    <span className="w-12 shrink-0 text-right font-display text-base font-semibold tabular-nums text-[#a97f16]">{o.percent}%</span>
                    <span className="hidden w-20 shrink-0 text-right text-xs tabular-nums text-[#7a7768] sm:block">{o.pool.toLocaleString()}</span>
                    <span className="w-16 shrink-0 text-right text-xs font-semibold tabular-nums text-[#a97f16]">{mult ? `×${mult.toFixed(2)}` : "—"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabs: activity | rules & source */}
          <div>
            <div className="flex gap-2 border-b border-[#eee6d3]">
              {([["activity", "Recent activity"], ["rules", "Rules & source"]] as const).map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition ${tab === key ? "border-[#c9a227] text-[#23252f]" : "border-transparent text-[#7a7768] hover:text-[#23252f]"}`}>
                  {label}
                </button>
              ))}
            </div>
            {tab === "activity" && (
              <div className="mt-3 divide-y divide-[#eee6d3] rounded-xl border border-[#eee6d3] bg-white">
                {m.activity.length === 0 && <div className="px-4 py-3 text-xs text-[#7a7768]">No predictions yet — be the first.</div>}
                {m.activity.slice(0, 10).map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 text-xs">
                    <span className="truncate text-[#5f6172]">Stake on <b className="text-[#23252f]">{m.options[a.option]?.label ?? `Option ${a.option}`}</b></span>
                    <span className="font-semibold tabular-nums text-[#a97f16]">{a.amount} USDC</span>
                  </div>
                ))}
              </div>
            )}
            {tab === "rules" && (
              <div className="mt-3 space-y-3 rounded-xl border border-[#eee6d3] bg-white p-4 text-xs leading-relaxed text-[#5f6172]">
                <p><b className="text-[#23252f]">How it settles.</b> Each outcome is a USDC pool; the percentages are the pools' shares. When the segment ends, the pageant resolves the winner in a public on-chain transaction, and correct predictions split the entire pool pro-rata. A {PLATFORM_FEE_PCT}% fee applies to <b>profit only</b> — your stake is never charged, and a sole winner pays no fee.</p>
                <p><b className="text-[#23252f]">Before close.</b> You can cancel any position while the market is open and your full stake returns to your wallet.</p>
                <p><b className="text-[#23252f]">If this market is cancelled.</b> Every stake is refunded in full — no fee, no exceptions. Funds sit in the smart contract at all times, never with CrownFi.</p>
                <p><b className="text-[#23252f]">Source.</b> The official pageant result as announced on the night, mirrored on-chain by the market resolver.</p>
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT: the order card (sticky) ════════════════ */}
        <div className="space-y-4 lg:sticky lg:top-24">
          <div className="card-gold p-5">
            <div className="flex items-center justify-between">
              <h2 className="tracking-tight text-lg font-semibold text-[#23252f]">Place a prediction</h2>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>{badge.label}</span>
            </div>

            {!canPredict ? (
              <p className="mt-3 text-sm text-[#7a7768]">
                {!m.onchain ? "This legacy market is view-only because it is not linked to the Base contract." : m.status === "resolved" ? "This market has been resolved — see the result above." : m.status === "cancelled" ? "This market was cancelled; claim your full refund below." : "This market is closed for new predictions."}
              </p>
            ) : !fan ? (
              <div className="mt-4">
                <button className="btn-gold w-full" onClick={connect}>{connecting ? "Connecting…" : "Connect wallet to predict"}</button>
                <p className="mt-2 text-center text-[11px] text-[#9a968b]">Base Account or MetaMask — browse freely before connecting.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {/* Outcome pills */}
                <div className="flex flex-wrap gap-1.5">
                  {m.options.map((o) => (
                    <button key={o.index} onClick={() => setPick(o.index)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${pick === o.index ? "border-[#a97f16]/50 bg-gradient-to-b from-[#e4c358] to-[#c39a2c] text-[#1a1f35]" : "border-[#e7e2d3] bg-white text-[#5f6172] hover:border-[#c9a227]"}`}>
                      <Flag sash={o.sash ?? ""} /> {o.label} <span className="tabular-nums opacity-80">{o.percent}%</span>
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input className="field !pr-14 tabular-nums" type="number" min="0" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Stake amount in USDC" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#9a968b]">USDC</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[10, 50, 100].map((v) => (
                    <button key={v} type="button" onClick={() => setAmount(String(v))} className="rounded-lg border border-[#e7e2d3] bg-white px-2.5 py-1 text-xs font-semibold tabular-nums text-[#5f6172] transition hover:border-[#c9a227]">+{v}</button>
                  ))}
                  <Link href="/funds" className="ml-auto text-xs text-[#a97f16] hover:underline">Get test USDC</Link>
                </div>
                {address && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#9a968b]">Wallet balance</span>
                    <span className={`font-semibold tabular-nums ${balance != null && amt > balance ? "text-[#9a5a12]" : "text-[#5f6172]"}`}>
                      {balance == null ? "—" : `${balance.toFixed(2)} USDC`}
                    </span>
                  </div>
                )}

                {/* Risk summary — plain numbers before the wallet popup */}
                {pick != null && amt > 0 && (
                  <div className="space-y-1.5 rounded-lg bg-white px-3 py-2.5 text-xs ring-1 ring-[#eee6d3]">
                    <div className="flex justify-between"><span className="text-[#7a7768]">Max wallet debit</span><span className="font-semibold tabular-nums text-[#23252f]">{amt.toLocaleString()} USDC</span></div>
                    <div className="flex justify-between"><span className="text-[#7a7768]">Max loss</span><span className="font-semibold tabular-nums text-[#9f1239]">{amt.toLocaleString()} USDC</span></div>
                    <div className="flex justify-between"><span className="text-[#7a7768]">Max payout (at current pools)</span><span className="font-semibold tabular-nums text-[#0f6e56]">{est.toLocaleString()} USDC</span></div>
                    <div className="flex justify-between"><span className="text-[#7a7768]">Fee ({PLATFORM_FEE_PCT}% of profit only)</span><span className="font-semibold tabular-nums text-[#23252f]">{feeIfWin.toLocaleString()} USDC</span></div>
                  </div>
                )}

                <button className="btn-gold w-full !py-3" disabled={busy || pick == null || !(amt > 0)} onClick={predict}>
                  {busy ? "Signing…" : pick == null ? "Select an outcome" : `Stake ${amt > 0 ? amt.toLocaleString() + " USDC on " : "on "}${m.options[pick]?.label}`}
                </button>
                {pick != null && amt > 0 && (
                  <p className="text-center text-[11px] text-[#9a968b]">Uses up to {amt.toLocaleString()} USDC from your wallet when you sign.</p>
                )}
              </div>
            )}
          </div>

          {/* Your positions */}
          {m.mine.length > 0 && (
            <div className="glass p-4">
              <div className="eyebrow mb-2">Your positions</div>
              <div className="space-y-2">
                {m.mine.map((p, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-lg surface-soft px-3 py-2 text-sm">
                    <span className="text-[#23252f]">{m.options[p.option]?.label ?? `Option ${p.option}`}</span>
                    <span className="flex items-center gap-2 text-[#5f6172]">
                      {p.amount} USDC · <span className={p.status === "won" ? "text-emerald-700" : p.status === "lost" ? "text-[#9f1239]" : "text-[#a97f16]"}>{p.status}</span>
                      {canPredict && p.status === "active" && (
                        <button disabled={busy} onClick={() => cancelPosition(p.option)} className="rounded-md border border-[#e7d0d0] px-2 py-0.5 text-xs text-[#9f1239] hover:bg-[#fbe9ef] disabled:opacity-50">Cancel</button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              {m.status === "resolved" && m.mine.some((p) => p.status === "won") && (
                <button className="btn-gold mt-3 w-full" disabled={busy} onClick={claim}>{busy ? "Claiming…" : "Claim winnings"}</button>
              )}
              {m.status === "cancelled" && m.mine.some((p) => ["active", "refundable", "lost"].includes(p.status)) && (
                <button className="btn-gold mt-3 w-full" disabled={busy} onClick={refund}>{busy ? "Refunding…" : "Claim full refund"}</button>
              )}
              {m.status === "cancelled" && m.mine.some((p) => p.status === "refunded") && (
                <div className="mt-3 rounded-lg bg-[#e1f5ee] px-3 py-2 text-center text-sm font-semibold text-[#0f6e56]">Refund claimed ✓</div>
              )}
              {m.status === "resolved" && m.mine.some((p) => p.status === "claimed") && !m.mine.some((p) => p.status === "won") && (
                <div className="mt-3 rounded-lg bg-[#e1f5ee] px-3 py-2 text-center text-sm font-semibold text-[#0f6e56]">Winnings claimed ✓</div>
              )}
            </div>
          )}
        </div>
      </div>

      <Toast msg={toast.msg} tone={toast.tone} />
    </div>
  );
}

function transactionError(error: any, fallback: string) {
  const message = String(error?.shortMessage ?? error?.message ?? "");
  if (/rejected|denied|cancelled/i.test(message)) return "Wallet confirmation was cancelled.";
  if (/insufficient funds|exceeds balance|transfer amount exceeds/i.test(message)) return "Not enough Base Sepolia ETH for gas or test USDC for this stake.";
  if (/transaction_wallet_unavailable/i.test(message)) return "Open the connected Base wallet, then try again.";
  return messageFor(message, fallback);
}

const CHART_COLORS = ["#d4af37", "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#8b5cf6", "#6366f1"];

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg surface-soft px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[#7a7768]">{label}</div>
      <div className="truncate text-sm font-semibold text-[#23252f]">{value}</div>
    </div>
  );
}
