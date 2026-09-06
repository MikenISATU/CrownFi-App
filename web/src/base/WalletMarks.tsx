import type { Connector } from "wagmi";

// Exact assets from the official Base, Coinbase Wallet, and MetaMask packages.
export function BaseMark({ className = "h-7 w-7", tone = "blue" }: { className?: string; tone?: "blue" | "white" }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/wallets/base-square-${tone}.svg`} alt="Base" className={`${className} object-contain`} />;
}

export function MetaMaskMark({ className = "h-7 w-7" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/wallets/metamask-fox.svg" alt="MetaMask" className={`${className} object-contain`} />;
}

export function CoinbaseWalletMark({ className = "h-7 w-7" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/wallets/coinbase-wallet.svg" alt="Coinbase Wallet" className={`${className} rounded-lg object-contain`} />;
}

export function ConnectorMark({ connector, className = "h-8 w-8" }: { connector: Connector; className?: string }) {
  const identity = `${connector.id} ${connector.name}`.toLowerCase();
  if (identity.includes("metamask")) return <MetaMaskMark className={className} />;
  if (identity.includes("coinbase")) return <CoinbaseWalletMark className={className} />;
  return <BaseMark className={`${className} rounded-lg`} />;
}

export function WalletMarkStack() {
  return (
    <span className="flex items-center" aria-hidden>
      <BaseMark className="h-4 w-4 rounded-[3px]" tone="blue" />
      <MetaMaskMark className="-ml-0.5 h-4 w-4" />
      <CoinbaseWalletMark className="-ml-0.5 h-4 w-4" />
    </span>
  );
}
