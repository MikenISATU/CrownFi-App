import { NextResponse } from "next/server";
import {
  BASE_SEPOLIA_ETH_FAUCET,
  BASE_SEPOLIA_ETH_FAUCETS,
  BASE_SEPOLIA_USDC_FAUCET,
  BASE_SEPOLIA_USDC_FAUCETS,
} from "@/base/faucets";

// CrownFi does not custody a Base faucet key. Return the verified public funding routes
// instead of pretending the former Stellar mint endpoint can fund a 0x wallet.
export async function POST() {
  return NextResponse.json({
    error: "external_faucet_required",
    ethFaucet: BASE_SEPOLIA_ETH_FAUCET,
    usdcFaucet: BASE_SEPOLIA_USDC_FAUCET,
    providers: {
      eth: BASE_SEPOLIA_ETH_FAUCETS,
      usdc: BASE_SEPOLIA_USDC_FAUCETS,
    },
    swapRequired: false,
  }, { status: 409 });
}
