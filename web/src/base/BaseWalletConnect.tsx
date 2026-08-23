"use client";

import { useState } from "react";
import { useAccount, useChainId, useConnect, useSwitchChain, type Connector } from "wagmi";
import { useSession } from "@/session/SessionProvider";
import { targetBaseChain } from "./config";
import { ConnectorMark, WalletMarkStack } from "./WalletMarks";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function BaseWalletConnect() {
  const [open, setOpen] = useState(false);
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const chainId = useChainId();
  const { connectAsync, connectors, error } = useConnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { fan, authenticate, connecting: authenticating, disconnect } = useSession();

  async function connectWith(connector: Connector) {
    setOpen(false);
    try {
      const result = await connectAsync({ connector, chainId: targetBaseChain.id });
      const connectedAddress = result.accounts[0];
      if (connectedAddress) await authenticate(connectedAddress);
    } catch {
      // Wagmi exposes the wallet error below the choices when the menu is reopened.
    }
  }

  if (isReconnecting) {
    return <button className="btn-ghost !min-h-[38px] !rounded-[11px] !px-3 text-xs" disabled>Restoring wallet…</button>;
  }

  if (isConnected && chainId !== targetBaseChain.id) {
    return (
      <button className="btn-gold !min-h-[38px] !rounded-[11px] !px-4 text-xs" disabled={switching}
        onClick={() => switchChain({ chainId: targetBaseChain.id })}>
        {switching ? "Switching…" : `Switch to ${targetBaseChain.name}`}
      </button>
    );
  }

  if (isConnected && address && !fan) {
    return (
      <button className="btn-gold !min-h-[38px] !rounded-[11px] !px-4 text-xs" disabled={authenticating}
        onClick={() => authenticate(address)}>
        {authenticating ? "Signing in…" : "Sign in with Base"}
      </button>
    );
  }

  if (isConnected && address && fan) {
    return (
      <button className="btn-ghost !min-h-[38px] !rounded-[11px] !px-3 font-mono text-xs" title="Disconnect Base wallet"
        onClick={() => disconnect()}>
        {shortAddress(address)}
      </button>
    );
  }

  return (
    <div className="relative">
      <button className="btn-gold !min-h-[38px] !rounded-[11px] !px-4 text-xs" disabled={isConnecting || authenticating}
        aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {isConnecting || authenticating ? "Connecting…" : <><WalletMarkStack /> Connect Wallet</>}
      </button>
      {open && (
        <div className="glass absolute right-0 z-50 mt-2 grid w-64 gap-1 p-2">
          {connectors.map((connector) => (
            <button key={connector.uid} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#3a3f52] transition hover:bg-[#faf6ea]"
              onClick={() => connectWith(connector)}>
              <ConnectorMark connector={connector} />
              <span className="min-w-0">
                <span className="block font-semibold text-[#23252f]">
                  {connector.id.toLowerCase().includes("metamask") ? "MetaMask" : connector.name}
                </span>
                <span className="mt-0.5 block text-[11px] text-[#8a8779]">
                  {connector.id.toLowerCase().includes("metamask") ? "Browser wallet on Base" : "Smart wallet for Base"}
                </span>
              </span>
            </button>
          ))}
          {error && <p className="px-2 pt-1 text-xs text-red-700">{error.message}</p>}
        </div>
      )}
    </div>
  );
}
