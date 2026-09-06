import Link from "next/link";
import { CheckCircle2, WalletCards } from "lucide-react";
import { TestnetFundingPanel } from "@/components/TestnetFundingPanel";

export default function TestnetFundsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="mx-auto max-w-3xl text-center">
        <div className="eyebrow">Test wallet setup</div>
        <h1 className="mt-4 tracking-tight text-4xl font-semibold text-[#23252f] sm:text-6xl">
          Get ready for <span className="font-display italic text-[#c8a233]">Base Sepolia.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#5f6172] sm:text-base">
          CrownFi’s testnet uses ETH to pay network gas and Circle’s Base Sepolia USDC for prediction stakes. Use the same wallet address for both assets; direct faucets are recommended over testnet swaps.
        </p>
      </header>

      <TestnetFundingPanel />

      <section className="grid gap-6 border-y border-[#e7e2d3] py-8 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="flex gap-3">
          <span className="num-gold">1</span>
          <div>
            <h2 className="font-display text-xl font-semibold text-[#23252f]">Connect and copy</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#5f6172]">Connect MetaMask, Base Account, or your Privy wallet and copy the public 0x address shown above.</p>
          </div>
        </div>
        <div className="hidden h-16 w-px bg-[#e7e2d3] md:block" />
        <div className="flex gap-3">
          <span className="num-gold">2</span>
          <div>
            <h2 className="font-display text-xl font-semibold text-[#23252f]">Claim and return</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#5f6172]">Claim ETH and USDC directly, then return to CrownFi. Some providers require an account and enforce their own limits.</p>
          </div>
        </div>
      </section>

      <div className="flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
        <span className="inline-flex items-center gap-2 text-sm text-[#5f6172]"><CheckCircle2 size={17} className="text-[#0f6e56]" /> Testnet assets have no monetary value.</span>
        <span className="hidden text-[#d4af37] sm:inline">·</span>
        <Link href="/predictions" className="btn-gold"><WalletCards size={16} /> Open prediction markets</Link>
      </div>
    </div>
  );
}
