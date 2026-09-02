import { NextRequest, NextResponse } from "next/server";
import { formatUnits, isAddress } from "viem";
import { baseContracts } from "@/base/contracts";
import { erc20Abi } from "@/base/abis";
import { basePublicClient } from "@/base/server";

// Read the official USDC balance directly from Base. This endpoint never mints or moves funds.
export async function GET(req: NextRequest) {
  const address = (req.nextUrl.searchParams.get("address") ?? "").trim();
  if (!isAddress(address)) return NextResponse.json({ balanceUsdc: 0 });
  try {
    const raw = await basePublicClient.readContract({
      address: baseContracts.usdc,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    });
    const balanceUsdc = Number(formatUnits(raw, 6));
    return NextResponse.json({ balanceUsdc });
  } catch (e) {
    console.error("[api/usdc-balance] read failed:", e);
    return NextResponse.json({ balanceUsdc: 0 });
  }
}
