"use client";

import { useCallback } from "react";
import { createWalletClient, custom, isAddressEqual, type Address } from "viem";
import { useWalletClient } from "wagmi";
import { targetBaseChain } from "./config";
import { usePrivyWalletResolver } from "./PrivyWalletBridge";

export function useBaseWalletClient() {
  const { data: connectedClient } = useWalletClient();
  const resolvePrivyWallet = usePrivyWalletResolver();

  return useCallback(async (expectedAddress: string) => {
    const expected = expectedAddress as Address;
    if (connectedClient?.account?.address && isAddressEqual(connectedClient.account.address, expected)) {
      return connectedClient;
    }

    const privyWallet = resolvePrivyWallet?.(expectedAddress);
    if (!privyWallet) throw new Error("transaction_wallet_unavailable");
    await privyWallet.switchChain(targetBaseChain.id);
    const provider = await privyWallet.getEthereumProvider();
    return createWalletClient({ account: expected, chain: targetBaseChain, transport: custom(provider) });
  }, [connectedClient, resolvePrivyWallet]);
}
