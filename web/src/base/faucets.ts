export const BASE_SEPOLIA_ETH_FAUCET = "https://www.alchemy.com/faucets/base-sepolia";
export const BASE_SEPOLIA_USDC_FAUCET = "https://faucet.circle.com/";

export const BASE_SEPOLIA_ETH_FAUCETS = [
  { label: "Alchemy", href: BASE_SEPOLIA_ETH_FAUCET },
  { label: "Coinbase CDP", href: "https://portal.cdp.coinbase.com/products/faucet" },
  { label: "Base faucet guide", href: "https://docs.base.org/get-started/get-funds" },
] as const;

export const BASE_SEPOLIA_USDC_FAUCETS = [
  { label: "Circle faucet", href: BASE_SEPOLIA_USDC_FAUCET },
  { label: "Coinbase CDP", href: "https://portal.cdp.coinbase.com/products/faucet" },
] as const;
