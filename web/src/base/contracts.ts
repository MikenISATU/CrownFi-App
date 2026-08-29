import type { Address } from "viem";
import { BASE_NETWORK } from "./config";
import { normalizeEnvValue } from "@/lib/publicEnv";

const OFFICIAL_USDC = {
  mainnet: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  sepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
} as const satisfies Record<typeof BASE_NETWORK, Address>;

function optionalAddress(value: string | undefined): Address | undefined {
  const normalized = normalizeEnvValue(value);
  return normalized && /^0x[a-fA-F0-9]{40}$/.test(normalized) ? normalized as Address : undefined;
}

/**
 * Contract addresses stay undefined until their Base replacements are deployed.
 * Feature code must treat an undefined address as "not migrated yet".
 */
export const baseContracts = {
  usdc: (optionalAddress(process.env.NEXT_PUBLIC_BASE_USDC_ADDRESS) || OFFICIAL_USDC[BASE_NETWORK]) as Address,
  vote: optionalAddress(process.env.NEXT_PUBLIC_BASE_VOTE_CONTRACT_ADDRESS),
  auditAnchor: optionalAddress(process.env.NEXT_PUBLIC_BASE_AUDIT_ANCHOR_ADDRESS),
  collectible: optionalAddress(process.env.NEXT_PUBLIC_BASE_COLLECTIBLE_CONTRACT_ADDRESS),
  predictionMarket: optionalAddress(process.env.NEXT_PUBLIC_BASE_PREDICTION_MARKET_ADDRESS),
  ticket: optionalAddress(process.env.NEXT_PUBLIC_BASE_TICKET_CONTRACT_ADDRESS),
} as const;

export const baseExplorerUrl = BASE_NETWORK === "mainnet"
  ? "https://basescan.org"
  : "https://sepolia.basescan.org";
