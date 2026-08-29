import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import hre from "hardhat";
import { keccak256, stringToHex } from "viem";

const { viem } = await hre.network.create({ chainType: "op" });

type Fixture = Awaited<ReturnType<typeof deployFixture>>;
let fixture: Fixture;

const eventKey = keccak256(stringToHex("coronation-night-2026"));
const seatA = keccak256(stringToHex("gold-a-01"));
const seatB = keccak256(stringToHex("gold-a-02"));

async function deployFixture(maxSupply = 2n) {
  const [owner, alice, bob, scanner] = await viem.getWalletClients();
  const ticket = await viem.deployContract("CrownFiTicket", [owner.account.address, maxSupply]);
  return { owner, alice, bob, scanner, ticket };
}

async function mintAlice(seatKey = seatA) {
  await fixture.ticket.write.mint([
    fixture.alice.account.address,
    eventKey,
    seatKey,
    3,
    "ipfs://crownfi/tickets/1.json",
  ]);
}

describe("CrownFiTicket", () => {
  beforeEach(async () => {
    fixture = await deployFixture();
  });

  it("mints ticket metadata and reserves a unique event seat", async () => {
    await mintAlice();
    assert.equal(
      (await fixture.ticket.read.ownerOf([1n])).toLowerCase(),
      fixture.alice.account.address.toLowerCase(),
    );
    assert.equal(await fixture.ticket.read.tokenURI([1n]), "ipfs://crownfi/tickets/1.json");
    assert.equal(await fixture.ticket.read.ticketForSeat([eventKey, seatA]), 1n);

    const data = await fixture.ticket.read.getTicket([1n]);
    assert.equal(data.eventKey, eventKey);
    assert.equal(data.seatKey, seatA);
    assert.equal(data.tier, 3);

    await assert.rejects(
      fixture.ticket.write.mint([
        fixture.bob.account.address,
        eventKey,
        seatA,
        3,
        "ipfs://crownfi/tickets/2.json",
      ]),
    );
  });

  it("supports a one-time seat assignment after mint", async () => {
    await mintAlice(`0x${"00".repeat(32)}`);
    await fixture.ticket.write.assignSeat([1n, seatB]);
    assert.equal(await fixture.ticket.read.ticketForSeat([eventKey, seatB]), 1n);
    await assert.rejects(fixture.ticket.write.assignSeat([1n, seatA]));
  });

  it("locks transfers and approvals until the organizer opens resale", async () => {
    await mintAlice();
    await assert.rejects(
      fixture.ticket.write.transferFrom(
        [fixture.alice.account.address, fixture.bob.account.address, 1n],
        { account: fixture.alice.account },
      ),
    );
    await assert.rejects(
      fixture.ticket.write.approve([fixture.bob.account.address, 1n], { account: fixture.alice.account }),
    );

    await fixture.ticket.write.setResaleOpen([true]);
    await fixture.ticket.write.transferFrom(
      [fixture.alice.account.address, fixture.bob.account.address, 1n],
      { account: fixture.alice.account },
    );
    assert.equal(
      (await fixture.ticket.read.ownerOf([1n])).toLowerCase(),
      fixture.bob.account.address.toLowerCase(),
    );
  });

  it("allows approved scanners to redeem exactly once and permanently blocks resale", async () => {
    await mintAlice();
    await fixture.ticket.write.setScanner([fixture.scanner.account.address, true]);
    await fixture.ticket.write.redeem([1n], { account: fixture.scanner.account });

    const data = await fixture.ticket.read.getTicket([1n]);
    assert.equal(data.redeemedBy.toLowerCase(), fixture.scanner.account.address.toLowerCase());
    assert.ok(data.redeemedAt > 0n);
    await assert.rejects(fixture.ticket.write.redeem([1n], { account: fixture.scanner.account }));

    await fixture.ticket.write.setResaleOpen([true]);
    await assert.rejects(
      fixture.ticket.write.transferFrom(
        [fixture.alice.account.address, fixture.bob.account.address, 1n],
        { account: fixture.alice.account },
      ),
    );
  });

  it("enforces mint pause, supply cap, and organizer-only controls", async () => {
    await mintAlice();
    await fixture.ticket.write.mint([
      fixture.bob.account.address,
      eventKey,
      seatB,
      2,
      "ipfs://crownfi/tickets/2.json",
    ]);
    await assert.rejects(
      fixture.ticket.write.mint([
        fixture.scanner.account.address,
        eventKey,
        keccak256(stringToHex("silver-a-01")),
        1,
        "ipfs://crownfi/tickets/3.json",
      ]),
    );

    await assert.rejects(
      fixture.ticket.write.setResaleOpen([true], { account: fixture.alice.account }),
    );
    await fixture.ticket.write.pause();
    await assert.rejects(
      fixture.ticket.write.mint([
        fixture.scanner.account.address,
        eventKey,
        keccak256(stringToHex("silver-a-02")),
        1,
        "ipfs://crownfi/tickets/4.json",
      ]),
    );
  });
});
