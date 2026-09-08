import { newAccountsPerIpLimit, shouldEnforceNewAccountLimit } from "./registrationLimit";

function assert(condition: unknown, label: string) {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
}

const previousNetwork = process.env.NEXT_PUBLIC_BASE_NETWORK;
const previousLimit = process.env.MAX_ACCOUNTS_PER_IP;

try {
  process.env.NEXT_PUBLIC_BASE_NETWORK = "sepolia";
  process.env.MAX_ACCOUNTS_PER_IP = "2";
  assert(newAccountsPerIpLimit() === 0, "Base Sepolia permits multiple test wallets from one IP");
  assert(!shouldEnforceNewAccountLimit("test-ip-hash"), "testnet registration cap is disabled");

  process.env.NEXT_PUBLIC_BASE_NETWORK = "mainnet";
  assert(newAccountsPerIpLimit() === 2, "Base Mainnet uses the configured registration cap");
  assert(shouldEnforceNewAccountLimit("test-ip-hash"), "mainnet registration cap is enabled");

  process.env.MAX_ACCOUNTS_PER_IP = "0";
  assert(newAccountsPerIpLimit() === 0, "a zero setting explicitly disables the mainnet cap");
  console.log("\nAll registration-limit checks passed.");
} finally {
  if (previousNetwork === undefined) delete process.env.NEXT_PUBLIC_BASE_NETWORK;
  else process.env.NEXT_PUBLIC_BASE_NETWORK = previousNetwork;
  if (previousLimit === undefined) delete process.env.MAX_ACCOUNTS_PER_IP;
  else process.env.MAX_ACCOUNTS_PER_IP = previousLimit;
}
