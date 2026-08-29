/**
 * Vercel's Environment Variables UI expects the raw value, without the quotes
 * used in .env files. Be forgiving when a quoted value is pasted there so one
 * formatting mistake cannot crash every statically rendered route.
 */
export function normalizeEnvValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return trimmed.slice(1, -1).trim() || null;
  }

  return trimmed;
}

/** Privy React SDK 3.x rejects App IDs that are not exactly 25 characters. */
export function normalizePrivyAppId(value: string | null | undefined): string | null {
  const normalized = normalizeEnvValue(value);
  return normalized?.length === 25 ? normalized : null;
}

export function normalizeHttpUrl(value: string | null | undefined): string | null {
  const normalized = normalizeEnvValue(value);
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString().replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}

export function normalizeHttpOrigin(value: string | null | undefined): string | null {
  const normalized = normalizeHttpUrl(value);
  return normalized ? new URL(normalized).origin : null;
}

export const publicPrivyAppId = normalizePrivyAppId(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
export const privyEnabled = publicPrivyAppId !== null;
export const publicAppOrigin = normalizeHttpOrigin(process.env.NEXT_PUBLIC_APP_ORIGIN) ?? "http://localhost:3000";
