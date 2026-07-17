"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/session/SessionProvider";
import { Toast } from "@/components/ui";
import { messageFor } from "@/lib/messages";
import { estimateReward, PLATFORM_FEE_PCT } from "@/lib/markets";
import { MarketView, CATEGORY_LABEL, statusBadge, timeLeft } from "@/components/MarketCard";
import { categoryImage } from "@/lib/segments";
import { OddsChart } from "@/components/OddsChart";

type Detail = MarketView & {
  activity: { option: number; amount: number; createdAt: string; status: string }[];
  mine: { option: number; amount: number; status: string }[];
  series: { t: number; pcts: number[] }[];
};

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const { fan, address, connect, connecting } = useSession();
  const [m, setM] = useState<Detail | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [pick, setPick] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ msg: "", tone: "ok" as "ok" | "err" });
  const flash = (msg: string, tone: "ok" | "err" = "ok") => { setToast({ msg, tone }); setTimeout(() => setToast({ msg: "", tone: "ok" }), 3200); };

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const r = await fetch(`/api/markets/${id}`, { cache: "no-store" });
      if (!r.ok) throw new Error();
      setM(await r.json());
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
      // 1) Prepare the stake (server tells us if this market is on-chain or a mock).
      const pr = await fetch(`/api/markets/${id}/prepare-stake`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ option: pick, amount: Number(amount) }) });
      const pd = await pr.json().catch(() => ({}));
      if (!pr.ok) { flash(stakeErr(pd.error), "err"); return; }

      // Off-chain / mock market → record directly.
      if (pd.mock) {
        const r = await fetch(`/api/markets/${id}/predict`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ option: pick, amount: Number(amount) }) });
        const d = await r.json().catch(() => ({}));
        if (r.ok) { flash(`Prediction placed! +${d.pointsAwarded ?? 0} points`); reset(); load(); refreshBalance(); }
        else flash(messageFor(d.error, "Could not place prediction."), "err");
        return;
      }

      // 2) Sign the stake in Freighter (authorizes the USDC transfer into escrow).
      const { signWithFreighter } = await import("@/wallet/freighter");
      const signed = await signWithFreighter(pd.xdr, fan.walletAddress);
      if (signed.error || !signed.signedXdr) { flash(messageFor(signed.error, "You cancelled the wallet signature."), "err"); return; }

      // 3) Submit + record on-chain.
      const cr = await fetch(`/api/markets/${id}/confirm-stake`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ signedXdr: signed.signedXdr, intentId: pd.intentId }) });
      const cd = await cr.json().catch(() => ({}));
      if (cr.ok) { flash(`Staked ${amount} USDC on-chain! +${cd.pointsAwarded ?? 0} points`); reset(); load(); refreshBalance(); }
      else flash(messageFor(cd.error, "Could not confirm your stake."), "err");
    } catch {
      flash("Something went wrong. Please try again.", "err");
    } finally {
      setBusy(false);
    }
  }

  // A prepare-stake failure is usually "no test USDC / no trustline" — point the user at the faucet.
  function stakeErr(code?: string): string {
    if (code && /balance|trustline|underfunded|insufficient/i.test(code)) return "Not enough test USDC — top up from the faucet, then try again.";
    return messageFor(code, "Could not start your prediction.");
  }

  async function getTestUsdc() {
    if (!fan) { flash("Connect your wallet first.", "err"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/faucet", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amountUsdc: 50 }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { flash("Sent 50 test USDC to your wallet. You can stake now."); refreshBalance(); }
      else flash(messageFor(d.error, "The faucet couldn’t send test USDC right now."), "err");
    } catch {
      flash("Something went wrong. Please try again.", "err");
    } finally {
      setBusy(false);
    }
  }

  // Cancel a position: withdraw the stake on `option` (on-chain unstake, refunds USDC).
  async function cancelPosition(option: number) {
    if (!fan) return;
    setBusy(true);
    try {
      const pr = await fetch(`/api/markets/${id}/prepare-unstake`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ option }) });
      const pd = await pr.json().catch(() => ({}));
      if (!pr.ok) { flash(messageFor(pd.error, "Could not start cancellation."), "err"); return; }
      const { signWithFreighter } = await import("@/wallet/freighter");
      const signed = await signWithFreighter(pd.xdr, fan.walletAddress);
      if (signed.error || !signed.signedXdr) { flash(messageFor(signed.error, "You cancelled the wallet signature."), "err"); return; }
      const cr = await fetch(`/api/markets/${id}/confirm-unstake`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ signedXdr: signed.signedXdr, intentId: pd.intentId }) });
      const cd = await cr.json().catch(() => ({}));
      if (cr.ok) { flash("Position cancelled — USDC refunded to your wallet."); load(); refreshBalance(); }
      else flash(messageFor(cd.error, "Could not cancel your position."), "err");
    } catch {
      flash("Something went wrong. Please try again.", "err");
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
      const { signWithFreighter } = await import("@/wallet/freighter");
      const signed = await signWithFreighter(pd.xdr, fan.walletAddress);
      if (signed.error || !signed.signedXdr) { flash(messageFor(signed.error, "You cancelled the wallet signature."), "err"); return; }
      const cr = await fetch(`/api/markets/${id}/confirm-claim`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ signedXdr: signed.signedXdr, intentId: pd.intentId }) });
      const cd = await cr.json().catch(() => ({}));
      if (cr.ok) { flash("Winnings claimed to your wallet! 🎉"); load(); refreshBalance(); }
      else flash(messageFor(cd.error, "Could not claim your winnings."), "err");
    } catch {
      flash("Something went wrong. Please try again.", "err");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return <div className="glass h-64 animate-pulse" />;
  if (state === "error" || !m) return <div className="glass p-10 text-center"><div className="font-display text-2xl text-[#23252f]">Market not found</div><Link href="/predictions" className="btn-gold mt-4 inline-block">Back to markets</Link></div>;

  const badge = statusBadge(m);
  const canPredict = m.status === "open" && m.endsInMs > 0;
  const est = pick != null && Number(amount) > 0 ? estimateReward(m, pick, Number(amount)) : 0;

  return (
    <div className="space-y-6">
      <Link href="/predictions" className="text-sm text-[#7a7768] hover:text-[#23252f]">← All markets</Link>

      <div className="glass overflow-hidden">
        <div className="relative px-6 py-5 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-[#eacb63] via-[#d4af37] to-[#b8912f]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.bannerUrl ?? categoryImage(m.category)} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-white/20 px-2 py-0.5 font-semibold">{CATEGORY_LABEL[m.category] ?? m.category}</span>
              <span className={`rounded-full px-2 py-0.5 font-semibold ${badge.cls}`}>{badge.label}</span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{m.question}</h1>
            <div className="mt-1 text-sm text-white/85">{m.status === "resolved" ? "Resolved" : timeLeft(m.endsInMs)} · {m.totalPool.toLocaleString()} USDC pool · {m.participants} participants</div>
          </div>
        </div>

        {m.status === "resolved" && m.winningOption != null && (
          <div className="flex flex-wrap items-center gap-2 border-t border-[#eee6d3] bg-[#f2fbf7] px-6 py-3 text-sm">
            <span className="text-lg" aria-hidden>🏆</span>
            <span className="text-[#0f6e56]"><b>{m.options[m.winningOption]?.label}</b> won this segment.</span>
            <span className="ml-auto rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">Result anchored on-chain</span>
          </div>
        )}

        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Options + predict */}
          <div className="space-y-3">
            {/* Outcomes — tabular (Polymarket-style): aligned Chance / Pool / To-win columns */}
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
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${pick === o.index ? "border-[#c9a227] bg-[#faf6ea]" : won ? "border-emerald-300 bg-emerald-50/50" : "border-[#eee6d3]"} ${canPredict ? "hover:border-[#c9a227]" : ""}`}>
                      <div className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 truncate font-medium text-[#23252f]">
                          {o.label}
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

            {canPredict && (
              <div className="rounded-xl surface-soft p-4">
                {!fan ? (
                  <button className="btn-gold w-full" onClick={connect}>{connecting ? "Connecting…" : "Connect wallet to predict"}</button>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-[#5f6172]">
                      {pick == null ? "Select an outcome above to predict" : <>Predicting on <span className="text-[#23252f]">{m.options[pick]?.label}</span></>}
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input className="field !pr-14 tabular-nums" type="number" min="0" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Stake amount in USDC" />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#9a968b]">USDC</span>
                      </div>
                      <button className="btn-gold shrink-0" disabled={busy || pick == null || !(Number(amount) > 0)} onClick={predict}>{busy ? "Signing…" : "Stake"}</button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[10, 50, 100].map((v) => (
                        <button key={v} type="button" onClick={() => setAmount(String(v))} className="rounded-lg border border-[#e7e2d3] bg-white px-2.5 py-1 text-xs font-semibold tabular-nums text-[#5f6172] transition hover:border-[#c9a227]">+{v}</button>
                      ))}
                      <button type="button" onClick={getTestUsdc} disabled={busy} className="ml-auto text-xs text-[#a97f16] hover:underline disabled:opacity-50">Get test USDC</button>
                    </div>
                    {address && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#9a968b]">Wallet balance</span>
                        <span className={`font-semibold tabular-nums ${balance != null && Number(amount) > balance ? "text-[#9a5a12]" : "text-[#5f6172]"}`}>
                          {balance == null ? "—" : `${balance.toFixed(2)} USDC`}
                        </span>
                      </div>
                    )}
                    {pick != null && Number(amount) > 0 && (
                      <>
                        <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-[#eee6d3]">
                          <span className="text-sm text-[#7a7768]">Est. payout if correct</span>
                          <span className="font-display text-lg font-semibold tabular-nums text-[#0f6e56]">{est.toLocaleString()} <span className="text-xs text-[#9a968b]">USDC</span></span>
                        </div>
                        <div className="text-[11px] text-[#9a968b]">Net of {PLATFORM_FEE_PCT}% fee on winnings · you approve the stake in your wallet.</div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Side: stats + my positions + rules + activity */}
          <div className="space-y-5">
            {/* Odds chart + stats */}
            <div>
              <div className="eyebrow mb-2">Odds over time</div>
              <OddsChart series={m.series} labels={m.options.map((o) => o.label)} colors={CHART_COLORS} />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <StatTile label="Total pool" value={`${m.totalPool.toLocaleString()} USDC`} />
                <StatTile label="Participants" value={String(m.participants)} />
                <StatTile label="Options" value={String(m.options.length)} />
                <StatTile label="Leading" value={[...m.options].sort((a, b) => b.percent - a.percent)[0]?.label ?? "—"} />
              </div>
            </div>

            {m.mine.length > 0 && (
              <div>
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
                {m.status === "resolved" && m.mine.some((p) => p.status === "claimed") && !m.mine.some((p) => p.status === "won") && (
                  <div className="mt-3 rounded-lg bg-[#e1f5ee] px-3 py-2 text-center text-sm font-semibold text-[#0f6e56]">Winnings claimed ✓</div>
                )}
              </div>
            )}
            <div>
              <div className="eyebrow mb-2">How it settles</div>
              <p className="text-xs leading-relaxed text-[#7a7768]">Each option is a USDC pool. Backing a lower-share option pays more per USDC if it wins (×multiplier above). You can cancel a position any time before the market closes to get your stake back. When the segment ends the admin resolves the winner on-chain, and correct predictions split the whole pool pro-rata — a {PLATFORM_FEE_PCT}% fee applies to winnings only.</p>
            </div>
            <div>
              <div className="eyebrow mb-2">Recent activity</div>
              <div className="glass divide-y divide-[#eee6d3]">
                {m.activity.length === 0 && <div className="px-3 py-3 text-xs text-[#7a7768]">No predictions yet.</div>}
                {m.activity.slice(0, 8).map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="truncate text-[#5f6172]">{m.options[a.option]?.label ?? `Option ${a.option}`}</span>
                    <span className="text-[#a97f16]">{a.amount} USDC</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast msg={toast.msg} tone={toast.tone} />
    </div>
  );
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
