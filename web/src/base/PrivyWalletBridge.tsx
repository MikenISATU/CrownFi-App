"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useWallets } from "@privy-io/react-auth";

type PrivyWallet = Awaited<ReturnType<typeof useWallets>>["wallets"][number];
type WalletResolver = (address: string) => PrivyWallet | undefined;

const PrivyWalletContext = createContext<WalletResolver | null>(null);

export function PrivyWalletBridge({ children }: { children: ReactNode }) {
  const { wallets } = useWallets();
  const resolve: WalletResolver = (address) => wallets.find((wallet) => wallet.address.toLowerCase() === address.toLowerCase());
  return <PrivyWalletContext.Provider value={resolve}>{children}</PrivyWalletContext.Provider>;
}

export function NoPrivyWalletBridge({ children }: { children: ReactNode }) {
  return <PrivyWalletContext.Provider value={null}>{children}</PrivyWalletContext.Provider>;
}

export function usePrivyWalletResolver() {
  return useContext(PrivyWalletContext);
}
