import "dotenv/config";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

const deployerPrivateKey = process.env.BASE_SEPOLIA_DEPLOYER_PRIVATE_KEY?.trim();

if (deployerPrivateKey && /^[0-9a-fA-F]{64}$/.test(deployerPrivateKey)) {
  process.env.BASE_SEPOLIA_DEPLOYER_PRIVATE_KEY = `0x${deployerPrivateKey}`;
} else if (deployerPrivateKey?.startsWith("0X")) {
  process.env.BASE_SEPOLIA_DEPLOYER_PRIVATE_KEY = `0x${deployerPrivateKey.slice(2)}`;
}

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.34",
        settings: { evmVersion: "cancun" },
      },
      production: {
        version: "0.8.34",
        settings: {
          evmVersion: "cancun",
          optimizer: { enabled: true, runs: 500 },
        },
      },
    },
  },
  networks: {
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    baseSepolia: {
      type: "http",
      chainType: "op",
      chainId: 84532,
      url: configVariable("BASE_SEPOLIA_RPC_URL", { default: "https://sepolia.base.org" }),
      accounts: [configVariable("BASE_SEPOLIA_DEPLOYER_PRIVATE_KEY")],
    },
  },
  test: {
    solidity: { isolate: true },
  },
});
