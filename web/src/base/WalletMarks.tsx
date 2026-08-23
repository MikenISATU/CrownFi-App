import type { Connector } from "wagmi";

// Exact assets from the official Base and MetaMask downloadable brand packs.
export function BaseMark({ className = "h-7 w-7", tone = "blue" }: { className?: string; tone?: "blue" | "white" }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/wallets/base-square-${tone}.svg`} alt="Base" className={`${className} object-contain`} />;
}

export function MetaMaskMark({ className = "h-7 w-7" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/wallets/metamask-fox.svg" alt="MetaMask" className={`${className} object-contain`} />;
}

export function ConnectorMark({ connector, className = "h-8 w-8" }: { connector: Connector; className?: string }) {
  const metamask = connector.id.toLowerCase().includes("metamask") || connector.name.toLowerCase().includes("metamask");
  return metamask ? <MetaMaskMark className={className} /> : <BaseMark className={`${className} rounded-lg`} />;
}

export function WalletMarkStack() {
  return (
    <span className="flex items-center" aria-hidden>
      <BaseMark className="h-4 w-4 rounded-[3px]" tone="white" />
      <MetaMaskMark className="-ml-0.5 h-4 w-4" />
    </span>
  );
}
