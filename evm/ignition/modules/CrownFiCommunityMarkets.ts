import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// Separate module/version from the original owner-created market deployment.
// This contract permits community creation while retaining owner-only settlement.
export default buildModule("CrownFiCommunityMarketsModule", (m) => {
  const deployer = m.getAccount(0);
  const predictionMarket = m.contract("CrownFiPredictionMarket", [
    deployer,
    BASE_SEPOLIA_USDC,
    deployer,
    200n,
  ]);

  return { predictionMarket };
});
