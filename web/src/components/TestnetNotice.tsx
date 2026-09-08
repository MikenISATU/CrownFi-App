export function TestnetNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-2xl border-2 border-[#f4e3a1] bg-[#050a4f] text-white shadow-[0_20px_50px_-34px_rgba(5,10,79,0.9)] ${compact ? "px-4 py-3" : "px-5 py-4 sm:px-6"}`} role="note" aria-label="Free testnet notice">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className={`${compact ? "text-sm" : "text-base sm:text-lg"} uppercase tracking-[0.14em] text-[#f2d784]`}>Free testnet demo</strong>
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">No real money</span>
      </div>
      {!compact && <p className="mt-1.5 text-xs text-white/70 sm:text-sm">Explore safely with Base Sepolia ETH and test USDC. Nothing here has real-world value.</p>}
    </div>
  );
}
