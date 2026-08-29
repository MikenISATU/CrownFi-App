import { NextRequest, NextResponse } from "next/server";
import { createAdminChallenge, isAdminAddress, normalizeEvmAddress } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawAddress = String(body?.address ?? "").trim();
  const address = normalizeEvmAddress(rawAddress);

  if (!address) return NextResponse.json({ error: "invalid_address" }, { status: 400 });
  if (!isAdminAddress(address)) return NextResponse.json({ error: "not_admin" }, { status: 403 });

  const challenge = createAdminChallenge(address, req);
  return NextResponse.json(challenge);
}
