import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CrownFiTicketModule", (m) => {
  const deployer = m.getAccount(0);
  const maxSupply = m.getParameter("maxSupply", 10_000n);
  const ticket = m.contract("CrownFiTicket", [deployer, maxSupply]);

  return { ticket };
});
