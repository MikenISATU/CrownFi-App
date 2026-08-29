import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MAX_SUPPLY_PER_CANDIDATE = 1_000_000n;

const metadata = [
  "ipfs://bafkreifq6hyokvqw56rfpnqddmczvnbyesxh64flup5mmzj3pwqrlviwca",
  "ipfs://bafkreiamcqzshg2sutejk3m5czstku35hcsct7ga7cye7hh6ws6f3wfhou",
  "ipfs://bafkreigtoodkz3rgprn6gsboktb2y6sdfdw2rgka2awghmwnnr55zidigu",
  "ipfs://bafkreiafi2dbwtz4yvjd5euv7towuyberr3xkgg6rigxa3x5w5y6zl3to4",
  "ipfs://bafkreicskkvgwn6cfwzmu5easnufmdcvdyp6kome2ma3yw7wpppcanjxia",
] as const;

export default buildModule("CrownFiCollectibleModule", (m) => {
  const deployer = m.getAccount(0);
  const collectible = m.contract("CrownFiCollectible", [deployer]);

  for (let index = 0; index < metadata.length; index += 1) {
    m.call(
      collectible,
      "addCandidate",
      [BigInt(index + 1), MAX_SUPPLY_PER_CANDIDATE, metadata[index]],
      { id: `AddCandidate${index + 1}` },
    );
  }

  return { collectible };
});
