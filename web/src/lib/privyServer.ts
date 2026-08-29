// Server-side Privy helper. Kept in one place so the (version-sensitive) Privy API
// surface is isolated. The client sends Privy's identity token, which the SDK verifies
// before returning the unified user and their automatically-created EVM wallet.

import { normalizeEnvValue, normalizePrivyAppId } from "@/lib/publicEnv";

function configuredAppId(): string | null {
  return normalizePrivyAppId(process.env.PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID);
}

export function privyConfigured(): boolean {
  return Boolean(configuredAppId() && normalizeEnvValue(process.env.PRIVY_APP_SECRET));
}

async function getPrivyClient(): Promise<any> {
  const appId = configuredAppId();
  const secret = normalizeEnvValue(process.env.PRIVY_APP_SECRET);
  if (!appId || !secret) throw new Error("privy_not_configured");
  const mod: any = await import("@privy-io/server-auth");
  return new mod.PrivyClient(appId, secret);
}

export type PrivyEvmIdentity = { userId: string; email: string | null; address: string };

export async function resolvePrivyEvmIdentity(identityToken: string): Promise<PrivyEvmIdentity> {
  const privy = await getPrivyClient();
  const user: any = await privy.getUser({ idToken: identityToken });
  const userId: string = user.id;
  const accounts: any[] = user?.linkedAccounts ?? [];
  const email: string | null =
    user?.email?.address ??
    accounts.find((a) => a.type === "email")?.address ??
    null;
  const embedded = accounts.find(
    (account) => account.type === "wallet" && account.chainType === "ethereum" && account.walletClientType === "privy",
  );
  const fallback = accounts.find((account) => account.type === "wallet" && account.chainType === "ethereum");
  const address: string | undefined = embedded?.address ?? user?.wallet?.address ?? fallback?.address;
  if (!address) throw new Error("no_evm_wallet");
  return { userId, email, address };
}
