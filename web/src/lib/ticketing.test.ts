import { convertToSeatId, normalizeSeatLabel, ticketSeatLabel } from "./tickets/seat";
import { TICKET_TIERS, TIER_LIST, tierListingId } from "./tiers";

function assert(condition: boolean, label: string) {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log("ok:", label);
}

console.log("Starting non-destructive ticketing checks...\n");
assert(TICKET_TIERS.Silver.priceUsdc === 50, "Silver tier is 50 USDC");
assert(TICKET_TIERS.Gold.priceUsdc === 100, "Gold tier is 100 USDC");
assert(TICKET_TIERS.Diamond.priceUsdc === 200, "Diamond tier is 200 USDC");
assert(TIER_LIST.length === 4, "There are exactly four ticket tiers");
assert(new Set(TIER_LIST.map((tier) => tier.listingId)).size === TIER_LIST.length, "Every tier has a unique listing id");
assert(TIER_LIST.every((tier) => tier.priceUsdc > 0 && tierListingId(tier.name) === tier.listingId), "Every tier resolves to its configured positive-price listing");
assert(normalizeSeatLabel("Row 2 · Seat 7") === "Row 2 Seat 7", "Seat labels normalize consistently");
assert(ticketSeatLabel("Row 2 • Seat 7") === "R2S7", "Voucher labels use the compact seat format");
assert(convertToSeatId("Row 2 · Seat 7", "Gold") === "G-2-7", "Seat-map ids round-trip with the tier");
assert(convertToSeatId("Unassigned", "Gold") === undefined, "Unassigned tickets do not reserve a seat");

console.log("\nAll non-destructive ticketing checks passed.");
