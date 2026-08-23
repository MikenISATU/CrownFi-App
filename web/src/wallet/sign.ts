"use client";
import type { Fan } from "@/session/SessionProvider";

// Legacy Stellar XDR signing stays isolated while each paid flow is replaced by a Base
// contract write. Base-connected fans must never be sent into a Freighter popup.
export async function signTx(
  _xdr: string,
  _fan: Pick<Fan, "walletAddress"> & { authProvider?: string | null }
): Promise<{ signedXdr?: string; error?: string }> {
  return {
    error: "This paid action is moving to Base and will open after its Base contract is deployed.",
  };
}
