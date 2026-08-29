import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, getAddress, http, isAddress, verifyMessage, type Address } from "viem";
import { base, baseSepolia } from "viem/chains";
import { signToken, verifyToken } from "@/lib/statelessToken";

const COOKIE = "crownfi_admin";
const SESSION_TTL_MS = 15 * 60 * 1000;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

type Challenge = { address: string; expiresAt: number };
type SessionPayload = { address: string; exp: number; iat: number };
type ChallengePayload = {
  a: Address;
  e: number;
  i: number;
  o: string;
  c: number;
  r: string;
};

const challenges = new Map<string, Challenge>();

export function adminAllowlist(): string[] {
  const configured = process.env.ADMIN_WALLETS?.trim() || process.env.NEXT_PUBLIC_ADMIN_WALLETS || "";
  return configured
    .split(",")
    .map((s) => s.trim())
    .filter((address) => isAddress(address))
    .map((address) => getAddress(address));
}

export function normalizeEvmAddress(address: string): Address | null {
  if (!isAddress(address)) return null;
  return getAddress(address);
}

export function isAdminAddress(address: string): boolean {
  const normalized = normalizeEvmAddress(address);
  if (!normalized) return false;
  return adminAllowlist().some((allowed) => allowed.toLowerCase() === normalized.toLowerCase());
}

function targetChain() {
  return process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet" ? base : baseSepolia;
}

function targetRpcUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet"
    ? process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL || "https://mainnet.base.org"
    : process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
}

function appOrigin(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_ORIGIN ||
    req.headers.get("origin") ||
    `${req.headers.get("x-forwarded-proto") ?? "http"}://${req.headers.get("host") ?? "localhost:3000"}`
  );
}

// Stateless nonce (HMAC token) so any serverless instance can verify — the Map is only a
// same-instance replay guard. See lib/statelessToken.ts for the rationale.
function challengeMessage(payload: ChallengePayload, nonce: string): string {
  const chain = targetChain();
  return [
    "CrownFi admin authorization",
    `Address: ${payload.a}`,
    `Chain: ${chain.name}`,
    `Chain ID: ${payload.c}`,
    `Nonce: ${nonce}`,
    `Origin: ${payload.o}`,
    `Issued At: ${new Date(payload.i).toISOString()}`,
    `Expires At: ${new Date(payload.e).toISOString()}`,
  ].join("\n");
}

export function createAdminChallenge(address: string, req: NextRequest): { nonce: string; message: string; expiresAt: number } {
  const normalized = normalizeEvmAddress(address);
  if (!normalized) throw new Error("invalid_address");

  const now = Date.now();
  const expiresAt = now + CHALLENGE_TTL_MS;
  const payload: ChallengePayload = {
    a: normalized,
    e: expiresAt,
    i: now,
    o: appOrigin(req),
    c: targetChain().id,
    r: randomBytes(8).toString("base64url"),
  };
  const nonce = signToken(payload);
  challenges.set(nonce, { address: normalized, expiresAt });
  const message = challengeMessage(payload, nonce);

  return { nonce, message, expiresAt };
}

function extractNonce(message: string): string | null {
  const match = message.match(/^Nonce: ([A-Za-z0-9_.-]+)$/m);
  return match?.[1] ?? null;
}

function sessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_SECRET is required in production");
  }

  return "dev-only-crownfi-admin-session-secret-change-before-deploy";
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function signPayload(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function verifyAdminSignature(params: {
  address: string;
  message: string;
  signature: string;
}): Promise<{ ok: true; address: Address } | { ok: false; error: string; status: number }> {
  const { address, message, signature } = params;
  const normalized = normalizeEvmAddress(address);
  if (!normalized) return { ok: false, error: "invalid_address", status: 400 };
  if (!isAdminAddress(normalized)) return { ok: false, error: "not_admin", status: 403 };

  const nonce = extractNonce(message);
  if (!nonce) return { ok: false, error: "missing_nonce", status: 400 };

  const payload = verifyToken<ChallengePayload>(nonce);
  if (!payload || payload.a.toLowerCase() !== normalized.toLowerCase()) {
    return { ok: false, error: "invalid_challenge", status: 401 };
  }
  if (Date.now() > payload.e) return { ok: false, error: "challenge_expired", status: 401 };
  if (payload.c !== targetChain().id || message !== challengeMessage(payload, nonce)) {
    return { ok: false, error: "invalid_challenge", status: 401 };
  }

  // Consume the in-memory challenge when this request reaches the same server instance.
  // The signed nonce remains independently verifiable across serverless instances.
  const local = challenges.get(nonce);
  challenges.delete(nonce);
  if (local) {
    if (local.address.toLowerCase() !== normalized.toLowerCase()) {
      return { ok: false, error: "invalid_challenge", status: 401 };
    }
    if (Date.now() > local.expiresAt) return { ok: false, error: "challenge_expired", status: 401 };
  }

  try {
    const hexSignature = signature as `0x${string}`;
    let valid = false;
    try {
      valid = await verifyMessage({ address: normalized, message, signature: hexSignature });
    } catch {
      // Contract-wallet signatures are not always decodable as an EOA signature.
      // Continue to the chain-aware verifier below.
    }

    // Base Account and other smart wallets may use ERC-1271/ERC-6492 signatures.
    // Public-client verification covers those while the offline check handles MetaMask EOAs.
    if (!valid) {
      const client = createPublicClient({ chain: targetChain(), transport: http(targetRpcUrl()) });
      valid = await client.verifyMessage({ address: normalized, message, signature: hexSignature });
    }
    if (!valid) return { ok: false, error: "bad_signature", status: 401 };
    return { ok: true, address: normalized };
  } catch {
    return { ok: false, error: "signature_verify_failed", status: 400 };
  }
}

export function createAdminSession(address: string): string {
  const normalized = normalizeEvmAddress(address);
  if (!normalized || !isAdminAddress(normalized)) throw new Error("not_admin");
  const now = Date.now();
  const payload: SessionPayload = { address: normalized, iat: now, exp: now + SESSION_TTL_MS };
  const encoded = base64url(JSON.stringify(payload));
  return `v1.${encoded}.${signPayload(encoded)}`;
}

export function setAdminCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearAdminCookie(res: NextResponse) {
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function readAdminSession(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;

  const [version, encoded, sig] = token.split(".");
  if (version !== "v1" || !encoded || !sig) return null;
  if (!safeEqual(signPayload(encoded), sig)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.address || !payload.exp || Date.now() > payload.exp) return null;
    if (!isAdminAddress(payload.address)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function requireAdmin(req: NextRequest): { address: string } | NextResponse {
  const session = readAdminSession(req);
  if (!session) return NextResponse.json({ error: "admin_auth_required" }, { status: 401 });
  return { address: session.address };
}
