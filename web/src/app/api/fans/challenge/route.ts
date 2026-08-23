import { NextRequest, NextResponse } from "next/server";
import { createFanChallenge } from "@/lib/fanAuth";
import { getAddress, isAddress } from "viem";

// Step 1 of Base wallet sign-in: hand the client a one-time message to sign.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const address = String(body?.address ?? "").trim();
  if (!isAddress(address)) {
    return NextResponse.json({ error: "invalid_address" }, { status: 400 });
  }
  const { message, expiresAt } = createFanChallenge(getAddress(address), req);
  return NextResponse.json({ message, expiresAt });
}
