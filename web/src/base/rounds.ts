import { keccak256, stringToHex, type Hex } from "viem";

export function baseRoundId(roundId: string): Hex {
  return keccak256(stringToHex(roundId));
}

export function bytes32FromDigest(digest: string): Hex {
  const value = digest.startsWith("0x") ? digest : `0x${digest}`;
  if (!/^0x[a-fA-F0-9]{64}$/.test(value)) throw new Error("invalid_digest");
  return value as Hex;
}
