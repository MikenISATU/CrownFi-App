import { createPublicClient, getAddress, http, isAddress, isAddressEqual, type Address, type Hash } from "viem";
import { base, baseSepolia } from "viem/chains";
import { normalizeEnvValue, normalizeHttpUrl } from "@/lib/publicEnv";

const mainnet = normalizeEnvValue(process.env.NEXT_PUBLIC_BASE_NETWORK) === "mainnet";
const chain = mainnet ? base : baseSepolia;
const rpcUrl = mainnet
  ? normalizeHttpUrl(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL) || "https://mainnet.base.org"
  : normalizeHttpUrl(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL) || "https://sepolia.base.org";

export const basePublicClient = createPublicClient({ chain, transport: http(rpcUrl) });

export function addressesEqual(a: string, b: string) {
  return isAddress(a) && isAddress(b) && isAddressEqual(getAddress(a), getAddress(b));
}

export async function verifiedBaseReceipt(params: { hash: string; from: string; to: Address }) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(params.hash)) throw new Error("invalid_transaction_hash");
  if (!isAddress(params.from)) throw new Error("invalid_wallet_address");
  const receipt = await basePublicClient.getTransactionReceipt({ hash: params.hash as Hash });
  if (receipt.status !== "success") throw new Error("transaction_reverted");
  if (!addressesEqual(receipt.from, params.from)) throw new Error("wallet_mismatch");
  if (!receipt.to || !isAddressEqual(receipt.to, params.to)) throw new Error("contract_mismatch");
  return receipt;
}
