import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { baseAccount, injected } from "wagmi/connectors";

// CrownFi now presents Base as its wallet/network layer. The old Stellar client remains
// in the repository only while its transaction routes are being ported.
export const BASE_MODE = true;
export const BASE_NETWORK = process.env.NEXT_PUBLIC_BASE_NETWORK === "mainnet" ? "mainnet" : "sepolia";
export const targetBaseChain = BASE_NETWORK === "mainnet" ? base : baseSepolia;

const baseMainnetRpc = process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL || "https://mainnet.base.org";
const baseSepoliaRpc = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

/**
 * Both Base networks are registered so the wallet can switch explicitly, while
 * targetBaseChain controls the network CrownFi expects for the current deployment.
 */
export const baseConfig = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    baseAccount({ appName: "CrownFi" }),
    injected({ target: "metaMask" }),
  ],
  multiInjectedProviderDiscovery: false,
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: http(baseMainnetRpc),
    [baseSepolia.id]: http(baseSepoliaRpc),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof baseConfig;
  }
}
