import { NextRequest } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import {
  createAdminChallenge,
  createAdminSession,
  isAdminAddress,
  readAdminSession,
  verifyAdminSignature,
} from "./adminAuth";

function assert(condition: boolean, label: string) {
  if (!condition) {
    console.error("FAIL:", label);
    process.exit(1);
  }
  console.log("ok:", label);
}

async function main() {
  const admin = privateKeyToAccount(`0x${"01".padStart(64, "0")}`);
  const stranger = privateKeyToAccount(`0x${"02".padStart(64, "0")}`);

  process.env.ADMIN_WALLETS = admin.address.toLowerCase();
  process.env.ADMIN_SESSION_SECRET = "admin-auth-test-secret-that-is-not-used-outside-tests";
  process.env.NEXT_PUBLIC_BASE_NETWORK = "sepolia";
  process.env.NEXT_PUBLIC_APP_ORIGIN = "http://localhost:3000";

  assert(isAdminAddress(admin.address), "allowlisted Base address is recognized case-insensitively");
  assert(!isAdminAddress(stranger.address), "non-allowlisted Base address is rejected");
  assert(!isAdminAddress("GABC"), "legacy Stellar address is rejected");

  const request = new NextRequest("http://localhost:3000/api/admin/challenge", {
    method: "POST",
    headers: { origin: "http://localhost:3000" },
  });
  const challenge = createAdminChallenge(admin.address.toLowerCase(), request);
  assert(challenge.message.includes("Chain: Base Sepolia"), "challenge is bound to Base Sepolia");
  assert(challenge.message.includes(`Address: ${admin.address}`), "challenge uses the canonical EVM address");

  const signature = await admin.signMessage({ message: challenge.message });
  const tampered = await verifyAdminSignature({
    address: admin.address,
    message: challenge.message.replace("Chain ID: 84532", "Chain ID: 1"),
    signature,
  });
  assert(!tampered.ok && tampered.error === "invalid_challenge", "tampered challenge text is rejected");

  const verified = await verifyAdminSignature({ address: admin.address, message: challenge.message, signature });
  assert(verified.ok && verified.address === admin.address, "MetaMask-compatible EIP-191 signature verifies");

  const token = createAdminSession(admin.address);
  const authenticatedRequest = new NextRequest("http://localhost:3000/api/admin/settings", {
    headers: { cookie: `crownfi_admin=${token}` },
  });
  const session = readAdminSession(authenticatedRequest);
  assert(session?.address === admin.address, "signed admin cookie restores the allowlisted address");

  console.log("\nAll Base admin-auth checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
