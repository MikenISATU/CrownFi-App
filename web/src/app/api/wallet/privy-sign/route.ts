import { NextResponse } from "next/server";

// Retained as an explicit tombstone while old callers are removed. Privy now creates
// EVM wallets for Base; Stellar XDR signing must never be offered to those users.
export async function POST() {
  return NextResponse.json({ error: "base_contract_pending" }, { status: 410 });
}
