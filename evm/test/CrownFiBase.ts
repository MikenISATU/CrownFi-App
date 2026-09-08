import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import hre from "hardhat";
import { parseUnits } from "viem";

const { viem, networkHelpers } = await hre.network.create({ chainType: "op" });

type Fixture = Awaited<ReturnType<typeof deployFixture>>;
let fixture: Fixture;

async function deployFixture() {
  const [owner, alice, bob, treasury] = await viem.getWalletClients();
  const usdc = await viem.deployContract("MockUSDC");
  const predictionMarket = await viem.deployContract("CrownFiPredictionMarket", [
    owner.account.address,
    usdc.address,
    treasury.account.address,
    200,
  ]);
  const auditAnchor = await viem.deployContract("CrownFiAuditAnchor", [owner.account.address]);

  const startingBalance = parseUnits("100", 6);
  for (const user of [alice, bob]) {
    await usdc.write.mint([user.account.address, startingBalance]);
    await usdc.write.approve([predictionMarket.address, startingBalance], { account: user.account });
  }

  return { owner, alice, bob, treasury, usdc, predictionMarket, auditAnchor, startingBalance };
}

async function createMarket(closeOffsetSeconds = 3600) {
  const publicClient = await viem.getPublicClient();
  const block = await publicClient.getBlock();
  const closeTime = Number(block.timestamp) + closeOffsetSeconds;
  await fixture.predictionMarket.write.createMarket([
    "Who will win the crown?",
    "overall",
    2,
    closeTime,
  ]);
  return { marketId: 1n, closeOffsetSeconds };
}

describe("CrownFiPredictionMarket", () => {
  beforeEach(async () => {
    fixture = await deployFixture();
  });

  it("escrows USDC and pays the winning side pro-rata with a fee only on profit", async () => {
    const { marketId, closeOffsetSeconds } = await createMarket();
    const stake = parseUnits("100", 6);

    await fixture.predictionMarket.write.stake([marketId, 0, stake], { account: fixture.alice.account });
    await fixture.predictionMarket.write.stake([marketId, 1, stake], { account: fixture.bob.account });
    await assert.rejects(fixture.predictionMarket.write.closeMarket([marketId]));
    await networkHelpers.time.increase(closeOffsetSeconds + 1);
    await fixture.predictionMarket.write.closeMarket([marketId]);
    await fixture.predictionMarket.write.resolveMarket([marketId, 0]);
    await fixture.predictionMarket.write.claim([marketId], { account: fixture.alice.account });

    assert.equal(await fixture.usdc.read.balanceOf([fixture.alice.account.address]), parseUnits("198", 6));
    assert.equal(await fixture.usdc.read.balanceOf([fixture.treasury.account.address]), parseUnits("2", 6));
    assert.equal(await fixture.predictionMarket.read.hasSettled([marketId, fixture.alice.account.address]), true);
    await assert.rejects(
      fixture.predictionMarket.write.claim([marketId], { account: fixture.alice.account }),
    );
  });

  it("returns every option position when a market is cancelled", async () => {
    const { marketId } = await createMarket();
    await fixture.predictionMarket.write.stake([marketId, 0, parseUnits("40", 6)], { account: fixture.alice.account });
    await fixture.predictionMarket.write.stake([marketId, 1, parseUnits("10", 6)], { account: fixture.alice.account });
    await fixture.predictionMarket.write.cancelMarket([marketId]);
    await fixture.predictionMarket.write.refund([marketId], { account: fixture.alice.account });

    assert.equal(await fixture.usdc.read.balanceOf([fixture.alice.account.address]), fixture.startingBalance);
    await assert.rejects(
      fixture.predictionMarket.write.refund([marketId], { account: fixture.alice.account }),
    );
  });

  it("lets any Base wallet create a market while keeping settlement owner-only", async () => {
    const publicClient = await viem.getPublicClient();
    const block = await publicClient.getBlock();
    const closeTime = Number(block.timestamp) + 3600;

    await fixture.predictionMarket.write.createMarket([
      "Will the Philippines reach the final five?",
      "yes_no",
      2,
      closeTime,
    ], { account: fixture.alice.account });

    const market = await fixture.predictionMarket.read.getMarket([1n]);
    assert.equal(market.question, "Will the Philippines reach the final five?");
    await assert.rejects(
      fixture.predictionMarket.write.cancelMarket([1n], { account: fixture.alice.account }),
    );
  });

  it("blocks new stakes while paused but leaves pre-close withdrawals available", async () => {
    const { marketId } = await createMarket();
    const stake = parseUnits("25", 6);
    await fixture.predictionMarket.write.stake([marketId, 0, stake], { account: fixture.alice.account });
    await fixture.predictionMarket.write.pause();

    await assert.rejects(
      fixture.predictionMarket.write.stake([marketId, 1, stake], { account: fixture.bob.account }),
    );
    await fixture.predictionMarket.write.unstake([marketId, 0], { account: fixture.alice.account });
    assert.equal(await fixture.usdc.read.balanceOf([fixture.alice.account.address]), fixture.startingBalance);
  });

  it("rejects unauthorized administration and resolution with no winning stake", async () => {
    const { marketId, closeOffsetSeconds } = await createMarket();
    await fixture.predictionMarket.write.stake([marketId, 0, parseUnits("10", 6)], { account: fixture.alice.account });

    await assert.rejects(
      fixture.predictionMarket.write.closeMarket([marketId], { account: fixture.alice.account }),
    );
    await assert.rejects(fixture.predictionMarket.write.resolveMarket([marketId, 0]));
    await networkHelpers.time.increase(closeOffsetSeconds + 1);
    await fixture.predictionMarket.write.closeMarket([marketId]);
    await assert.rejects(fixture.predictionMarket.write.resolveMarket([marketId, 1]));
  });
});

describe("CrownFiAuditAnchor", () => {
  beforeEach(async () => {
    fixture = await deployFixture();
  });

  it("publishes a checkpoint exactly once", async () => {
    const roundId = `0x${"11".repeat(32)}` as const;
    const merkleRoot = `0x${"22".repeat(32)}` as const;
    const tallyHash = `0x${"33".repeat(32)}` as const;

    await fixture.auditAnchor.write.publish([roundId, merkleRoot, tallyHash, 14n]);
    const checkpoint = await fixture.auditAnchor.read.getCheckpoint([roundId]);
    assert.equal(checkpoint.merkleRoot, merkleRoot);
    assert.equal(checkpoint.tallyHash, tallyHash);
    assert.equal(checkpoint.totalVotes, 14n);
    await assert.rejects(fixture.auditAnchor.write.publish([roundId, merkleRoot, tallyHash, 15n]));
  });

  it("rejects checkpoint publication from a non-owner", async () => {
    const roundId = `0x${"44".repeat(32)}` as const;
    const merkleRoot = `0x${"55".repeat(32)}` as const;
    const tallyHash = `0x${"66".repeat(32)}` as const;
    await assert.rejects(
      fixture.auditAnchor.write.publish([roundId, merkleRoot, tallyHash, 1n], { account: fixture.alice.account }),
    );
  });
});
