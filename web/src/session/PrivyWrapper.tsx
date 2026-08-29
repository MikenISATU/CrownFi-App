"use client";
import { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { base, baseSepolia } from "viem/chains";
import { targetBaseChain } from "@/base/config";
import { publicPrivyAppId } from "@/lib/publicEnv";

// Privy is optional locally. When configured it gives email/Google users an EVM
// embedded wallet automatically; Base Sepolia remains the default test network.
export function PrivyWrapper({ children }: { children: ReactNode }) {
  if (!publicPrivyAppId) return <>{children}</>;
  return (
    <PrivyProvider
      appId={publicPrivyAppId}
      config={{
        loginMethods: ["email", "google"],
        defaultChain: targetBaseChain,
        supportedChains: [baseSepolia, base],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
          solana: { createOnLogin: "off" },
        },
        appearance: { theme: "light", accentColor: "#0000FF", logo: "/brand/logo.png" },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
