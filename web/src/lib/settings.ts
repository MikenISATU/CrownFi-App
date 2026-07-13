import { db } from "@/lib/db";

// Platform settings singleton (payments + KYC + environment). Read anywhere; edited by admin.

export type Settings = {
  id: string;
  paymentsEnabled: boolean;
  kycEnabled: boolean;
  kycMandatory: boolean;
  environment: string; // testnet | production
  activeProvider: string;
  maintenanceMode: boolean;
  providerConfig: string | null;
};

const DEFAULTS: Omit<Settings, "id"> = {
  paymentsEnabled: true,
  kycEnabled: false,
  kycMandatory: false,
  environment: "testnet",
  activeProvider: "testnet_usdc",
  maintenanceMode: false,
  providerConfig: null,
};

export async function getSettings(): Promise<Settings> {
  try {
    const s = await db.platformSettings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    return s as unknown as Settings;
  } catch {
    return { id: "singleton", ...DEFAULTS };
  }
}

// Whether paid actions (mint, tickets, stakes) may proceed right now — enforced server-side by
// the paid endpoints so the admin toggles actually gate purchases (not just display).
export async function paymentsAllowed(): Promise<{ ok: true } | { ok: false; reason: "maintenance" | "payments_disabled" }> {
  const s = await getSettings();
  if (s.maintenanceMode) return { ok: false, reason: "maintenance" };
  if (!s.paymentsEnabled) return { ok: false, reason: "payments_disabled" };
  return { ok: true };
}

const EDITABLE = ["paymentsEnabled", "kycEnabled", "kycMandatory", "environment", "activeProvider", "maintenanceMode", "providerConfig"] as const;

export async function updateSettings(patch: Record<string, any>): Promise<Settings> {
  const data: Record<string, any> = {};
  for (const k of EDITABLE) if (k in patch) data[k] = patch[k];
  if ("environment" in data && !["testnet", "production"].includes(data.environment)) delete data.environment;
  const s = await db.platformSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });
  return s as unknown as Settings;
}
