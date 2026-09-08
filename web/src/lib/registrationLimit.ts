import { normalizeEnvValue } from "@/lib/publicEnv";

// Multiple test wallets are normal during Base Sepolia testing. Apply the anti-sybil
// registration cap only when CrownFi explicitly runs on Base Mainnet.
export function newAccountsPerIpLimit(): number {
  if (normalizeEnvValue(process.env.NEXT_PUBLIC_BASE_NETWORK) !== "mainnet") return 0;
  const configured = Number(process.env.MAX_ACCOUNTS_PER_IP ?? "2");
  return Number.isSafeInteger(configured) && configured > 0 ? configured : 0;
}

export function shouldEnforceNewAccountLimit(ipHash: string | null): ipHash is string {
  return Boolean(ipHash) && newAccountsPerIpLimit() > 0;
}
