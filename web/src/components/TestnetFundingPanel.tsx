"use client";

import { useState } from "react";
import { Check, CircleDollarSign, Copy, ExternalLink, Fuel, WalletCards } from "lucide-react";
import { useSession } from "@/session/SessionProvider";
import { baseContracts } from "@/base/contracts";
import { BASE_SEPOLIA_FUNDING_GUIDE, BASE_SEPOLIA_USDC_FAUCET } from "@/base/faucets";
import { useBaseWalletClient } from "@/base/useBaseWalletClient";

type TestnetFundingPanelProps = {
  compact?: boolean;
  className?: string;
};

function shortAddress(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function TestnetFundingPanel({ compact = false, className = "" }: TestnetFundingPanelProps) {
  const { address } = useSession();
  const getWalletClient = useBaseWalletClient();
  const [copied, setCopied] = useState<"wallet" | "usdc" | "funding" | null>(null);
  const [assetState, setAssetState] = useState<"idle" | "adding" | "added" | "error">("idle");

  async function copy(value: string, kind: "wallet" | "usdc" | "funding") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  function openFunding(href: string) {
    // Open synchronously so mobile and in-app browsers do not block the new tab.
    window.open(href, "_blank", "noopener,noreferrer");
    if (address) void copy(address, "funding");
  }

  async function addUsdcToWallet() {
    if (!address) return;
    setAssetState("adding");
    try {
      const wallet = await getWalletClient(address);
      const added = await (wallet.request as (args: unknown) => Promise<unknown>)({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: { address: baseContracts.usdc, symbol: "USDC", decimals: 6 },
        },
      });
      setAssetState(added === false ? "error" : "added");
    } catch {
      setAssetState("error");
    }
  }

  return (
    <section
      aria-labelledby="testnet-funds-title"
      className={`overflow-hidden rounded-2xl border border-[#f4e3a1]/70 bg-[#050a4f] text-white shadow-[0_24px_55px_-36px_rgba(5,10,79,0.68)] ${className}`}
    >
      <div className={`grid ${compact ? "lg:grid-cols-[0.95fr_1.55fr]" : "lg:grid-cols-[0.9fr_1.45fr]"}`}>
        <div className={`${compact ? "p-5 sm:p-6" : "p-6 sm:p-8"}`}>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f2cf67]">Base Sepolia testnet</div>
          <h2 id="testnet-funds-title" className={`${compact ? "mt-2 text-2xl" : "mt-3 text-3xl sm:text-4xl"} tracking-tight font-semibold`}>
            Fund your test wallet
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-[#c7d1f6]">
            You need test ETH for gas and test USDC for predictions and tickets. Both have no real-world value.
          </p>

          {address ? (
            <button
              type="button"
              onClick={() => copy(address, "wallet")}
              className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 text-xs font-medium text-[#eef1ff] transition hover:border-[#f2cf67]/60 hover:bg-white/12"
            >
              {copied === "wallet" ? <Check size={14} /> : <Copy size={14} />}
              {copied === "wallet" ? "Wallet copied" : `Copy ${shortAddress(address)}`}
            </button>
          ) : (
            <p className="mt-4 text-xs text-[#9faddc]">Connect a wallet, then copy its address into either faucet.</p>
          )}
        </div>

        <div className="grid border-t border-white/10 sm:grid-cols-2 lg:border-l lg:border-t-0">
          <div className={`${compact ? "p-5 sm:p-6" : "p-6 sm:p-8"} border-b border-white/10 sm:border-b-0 sm:border-r`}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#0000c8] ring-1 ring-[#d4af37]/70">
                <Fuel size={20} strokeWidth={1.8} />
              </span>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8fa8ff]">Step 1 · gas</div>
                <h3 className="mt-0.5 font-display text-xl font-semibold">Base Sepolia ETH</h3>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#b8c4eb]">Open Base's maintained funding guide and use a listed provider for Base Sepolia ETH. Your wallet address is copied automatically.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => openFunding(BASE_SEPOLIA_FUNDING_GUIDE)} className="btn-gold !min-h-[38px] !px-4 !py-2 text-xs">
                {copied === "funding" ? "Address copied · open guide" : "Get test ETH"} <ExternalLink size={13} />
              </button>
            </div>
          </div>

          <div className={`${compact ? "p-5 sm:p-6" : "p-6 sm:p-8"}`}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#2775ca] ring-1 ring-white/20">
                <CircleDollarSign size={21} strokeWidth={1.8} />
              </span>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8fa8ff]">Step 2 · payment</div>
                <h3 className="mt-0.5 font-display text-xl font-semibold">Base Sepolia USDC</h3>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#b8c4eb]">Use Circle's official faucet, select Base Sepolia and paste the copied address. Direct funding avoids unverified swap pools and incompatible mock tokens.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => openFunding(BASE_SEPOLIA_USDC_FAUCET)} className="btn-gold !min-h-[38px] !px-4 !py-2 text-xs">
                {copied === "funding" ? "Address copied · open Circle" : "Get 20 test USDC"} <ExternalLink size={13} />
              </button>
              {address && (
                <button type="button" onClick={addUsdcToWallet} disabled={assetState === "adding"}
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-[11px] border border-white/18 bg-white/8 px-3 text-xs font-medium text-[#eef1ff] transition hover:border-[#f2cf67]/60 hover:bg-white/12 disabled:opacity-60">
                  {assetState === "added" ? <Check size={13} /> : <WalletCards size={13} />}
                  {assetState === "adding" ? "Opening wallet…" : assetState === "added" ? "USDC added" : "Add USDC to wallet"}
                </button>
              )}
              <button
                type="button"
                onClick={() => copy(baseContracts.usdc, "usdc")}
                className="inline-flex min-h-[38px] items-center gap-2 rounded-[11px] border border-white/18 bg-white/8 px-3 text-xs font-medium text-[#eef1ff] transition hover:border-[#f2cf67]/60 hover:bg-white/12"
                title="Copy the official Base Sepolia USDC contract address"
              >
                {copied === "usdc" ? <Check size={13} /> : <Copy size={13} />}
                {copied === "usdc" ? "Copied" : "USDC address"}
              </button>
            </div>
            {assetState === "error" && <p className="mt-2 text-[11px] text-[#f4e3a1]">This wallet did not accept the add-token request. Copy the USDC address and add it manually.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
