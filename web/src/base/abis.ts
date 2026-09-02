import { parseAbi } from "viem";

export const erc20Abi = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

export const predictionMarketAbi = parseAbi([
  "function createMarket(string question, string category, uint8 numOptions, uint64 closeTime) returns (uint256 marketId)",
  "function stake(uint256 marketId, uint8 option, uint256 amount)",
  "function unstake(uint256 marketId, uint8 option) returns (uint256 amount)",
  "function closeMarket(uint256 marketId)",
  "function resolveMarket(uint256 marketId, uint8 winningOption)",
  "function cancelMarket(uint256 marketId)",
  "function claim(uint256 marketId) returns (uint256 net)",
  "function refund(uint256 marketId) returns (uint256 amount)",
  "function marketCount() view returns (uint256)",
  "function getMarket(uint256 marketId) view returns ((string question, string category, uint64 closeTime, uint8 numOptions, uint8 status, uint8 winningOption, uint16 feeBps, address treasury, uint256 totalPool, uint256 payoutsPaid, uint256 feesPaid))",
  "event MarketCreated(uint256 indexed marketId, string question, string category, uint8 numOptions, uint64 closeTime, uint16 feeBps, address indexed treasury)",
  "event Staked(uint256 indexed marketId, address indexed user, uint8 indexed option, uint256 amount)",
  "event Unstaked(uint256 indexed marketId, address indexed user, uint8 indexed option, uint256 amount)",
  "event MarketClosed(uint256 indexed marketId)",
  "event MarketResolved(uint256 indexed marketId, uint8 indexed winningOption, uint256 winningPool)",
  "event MarketCancelled(uint256 indexed marketId)",
  "event Claimed(uint256 indexed marketId, address indexed user, uint256 gross, uint256 fee, uint256 net)",
  "event Refunded(uint256 indexed marketId, address indexed user, uint256 amount)",
]);

export const auditAnchorAbi = parseAbi([
  "function publish(bytes32 roundId, bytes32 merkleRoot, bytes32 tallyHash, uint64 totalVotes)",
  "function exists(bytes32 roundId) view returns (bool)",
  "event CheckpointPublished(bytes32 indexed roundId, bytes32 indexed merkleRoot, bytes32 indexed tallyHash, uint64 totalVotes, uint64 publishedAt)",
]);
