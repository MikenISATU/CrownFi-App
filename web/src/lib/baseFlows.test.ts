import { predictionMarketAbi } from "@/base/abis";
import {
  BASE_SEPOLIA_ETH_FAUCET,
  BASE_SEPOLIA_ETH_FAUCETS,
  BASE_SEPOLIA_USDC_FAUCET,
  BASE_SEPOLIA_USDC_FAUCETS,
} from "@/base/faucets";
import { baseRoundId, bytes32FromDigest } from "@/base/rounds";
import { computeMarketView, estimateReward } from "./markets";

function assert(condition: boolean, label: string) {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log("ok:", label);
}

const closeTime = new Date(Date.now() + 60_000);
const market = computeMarketView({
  id: "db-market-1",
  chainMarketId: 7,
  pageantId: null,
  creatorFanId: null,
  category: "overall",
  question: "Who wins?",
  optionsJson: JSON.stringify(["A", "B"]),
  status: "open",
  closeTime,
  winningOption: null,
  bannerUrl: null,
}, [
  { option: 0, amount: 25, fanId: "fan-a" },
  { option: 1, amount: 75, fanId: "fan-b" },
]);

assert(market.onchain && market.chainMarketId === 7, "Base-linked markets are identified explicitly");
assert(market.totalPool === 100 && market.options[1].percent === 75, "Market pools and odds use recorded stakes");
assert(market.participants === 2 && market.live, "Live market participation is calculated correctly");
assert(estimateReward(market, 0, 25) === 61.75, "Reward estimate charges 2% only on profit");
assert(/^0x[a-f0-9]{64}$/.test(baseRoundId("round-1")), "Round ids map deterministically to bytes32");
assert(bytes32FromDigest("ab".repeat(32)) === `0x${"ab".repeat(32)}`, "Merkle and tally digests map to bytes32");
assert(BASE_SEPOLIA_ETH_FAUCET === "https://www.alchemy.com/faucets/base-sepolia", "Base Sepolia ETH uses the requested Alchemy faucet");
assert(BASE_SEPOLIA_USDC_FAUCET === "https://faucet.circle.com/", "Base Sepolia USDC uses Circle's official faucet");
assert(BASE_SEPOLIA_ETH_FAUCETS.some((provider) => provider.label === "Coinbase CDP"), "ETH funding offers a second verified provider");
assert(BASE_SEPOLIA_USDC_FAUCETS.some((provider) => provider.label === "Coinbase CDP"), "USDC funding offers a second verified provider");
assert(predictionMarketAbi.some((item) => item.type === "function" && item.name === "refund"), "Prediction ABI includes cancelled-market refunds");

console.log("\nAll Base flow checks passed.");
