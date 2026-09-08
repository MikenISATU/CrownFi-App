import { NextResponse } from "next/server";
import {
  BASE_SEPOLIA_FUNDING_GUIDE,
  BASE_SEPOLIA_USDC_FAUCET,
} from "@/base/faucets";

// CrownFi does not custody a Base faucet key. Return the verified public funding routes
// instead of pretending the app can fund a user's wallet.
export async function POST() {
  return NextResponse.json({
    error: "external_faucet_required",
    ethFaucet: BASE_SEPOLIA_FUNDING_GUIDE,
    usdcFaucet: BASE_SEPOLIA_USDC_FAUCET,
    providers: {
      eth: [{ label: "Base funding guide", href: BASE_SEPOLIA_FUNDING_GUIDE }],
      usdc: [{ label: "Circle faucet", href: BASE_SEPOLIA_USDC_FAUCET }],
    },
    swapRequired: false,
    swapSupported: false,
  }, { status: 409 });
}
