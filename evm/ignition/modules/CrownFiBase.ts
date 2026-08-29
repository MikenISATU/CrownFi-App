import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export default buildModule("CrownFiBaseModule", (m) => {
  const deployer = m.getAccount(0);

  const predictionMarket = m.contract("CrownFiPredictionMarket", [
    deployer,
    BASE_SEPOLIA_USDC,
    deployer,
    200n,
  ]);
  const auditAnchor = m.contract("CrownFiAuditAnchor", [deployer]);

  return { predictionMarket, auditAnchor };
});
