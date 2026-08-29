import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import hre from "hardhat";

const { viem } = await hre.network.create({ chainType: "op" });

type Fixture = Awaited<ReturnType<typeof deployFixture>>;
let fixture: Fixture;

const indonesiaMetadata = "ipfs://bafkreifq6hyokvqw56rfpnqddmczvnbyesxh64flup5mmzj3pwqrlviwca";

async function deployFixture(maxSupply = 2n) {
  const [owner, alice, bob] = await viem.getWalletClients();
  const collectible = await viem.deployContract("CrownFiCollectible", [owner.account.address]);
  await collectible.write.addCandidate([1n, maxSupply, indonesiaMetadata]);
  return { owner, alice, bob, collectible };
}

describe("CrownFiCollectible", () => {
  beforeEach(async () => {
    fixture = await deployFixture();
  });

  it("registers candidate metadata and mints the configured ERC-721", async () => {
    await fixture.collectible.write.adminMint([fixture.alice.account.address, 1n]);

    assert.equal(
      (await fixture.collectible.read.ownerOf([1n])).toLowerCase(),
      fixture.alice.account.address.toLowerCase(),
    );
    assert.equal(await fixture.collectible.read.tokenURI([1n]), indonesiaMetadata);
    assert.equal(await fixture.collectible.read.tokenCandidate([1n]), 1n);
    assert.equal(await fixture.collectible.read.hasMinted([fixture.alice.account.address, 1n]), true);
    assert.equal(await fixture.collectible.read.totalSupply(), 1n);
  });

  it("enforces one mint per wallet per candidate permanently", async () => {
    await fixture.collectible.write.adminMint([fixture.alice.account.address, 1n]);
    await fixture.collectible.write.transferFrom(
      [fixture.alice.account.address, fixture.bob.account.address, 1n],
      { account: fixture.alice.account },
    );
    await assert.rejects(
      fixture.collectible.write.adminMint([fixture.alice.account.address, 1n]),
    );
  });

  it("enforces per-candidate supply and owner-only minting", async () => {
    fixture = await deployFixture(1n);
    await assert.rejects(
      fixture.collectible.write.adminMint(
        [fixture.alice.account.address, 1n],
        { account: fixture.alice.account },
      ),
    );
    await fixture.collectible.write.adminMint([fixture.alice.account.address, 1n]);
    await assert.rejects(
      fixture.collectible.write.adminMint([fixture.bob.account.address, 1n]),
    );
  });

  it("allows metadata corrections only before minting starts", async () => {
    const corrected = "ipfs://corrected-metadata";
    await fixture.collectible.write.setCandidateMetadata([1n, corrected]);
    assert.equal((await fixture.collectible.read.candidate([1n])).metadataURI, corrected);

    await fixture.collectible.write.adminMint([fixture.alice.account.address, 1n]);
    await assert.rejects(
      fixture.collectible.write.setCandidateMetadata([1n, indonesiaMetadata]),
    );
  });

  it("pauses minting and transfers until the owner resumes them", async () => {
    await fixture.collectible.write.adminMint([fixture.alice.account.address, 1n]);
    await fixture.collectible.write.pause();
    await assert.rejects(
      fixture.collectible.write.adminMint([fixture.bob.account.address, 1n]),
    );
    await assert.rejects(
      fixture.collectible.write.transferFrom(
        [fixture.alice.account.address, fixture.bob.account.address, 1n],
        { account: fixture.alice.account },
      ),
    );

    await fixture.collectible.write.unpause();
    await fixture.collectible.write.transferFrom(
      [fixture.alice.account.address, fixture.bob.account.address, 1n],
      { account: fixture.alice.account },
    );
  });
});
