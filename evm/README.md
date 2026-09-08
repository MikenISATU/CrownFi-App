# CrownFi Base contracts

Base Sepolia Solidity contracts for CrownFi's prediction, proof, ticket, and collectible scope.

## Included

- `CrownFiPredictionMarket`: pageant-only USDC pools, staking, pre-close unstaking,
  close/resolve/cancel, pro-rata winner claims, cancellation refunds, a fee on profit,
  emergency pause, two-step ownership transfer, and per-market fee/treasury snapshots.
- `CrownFiAuditAnchor`: owner-published, write-once Merkle/tally checkpoints for off-chain votes.
- `CrownFiTicket`: organizer-minted ERC-721 tickets with unique event seats, locked resale,
  registered scanners, one-time redemption, emergency pause, and a configurable supply cap.
- `CrownFiCollectible`: platform-minted ERC-721 delegate collectibles with candidate metadata,
  per-candidate supply caps, one mint per wallet per candidate, metadata freezing, and emergency pause.

## Intentionally excluded

No separate collectible sale-splitter or raw-vote contract is deployed. The voting path remains
backend-first; only its compact closed-round proof is anchored on Base. Collectible payment is
confirmed off-chain before the platform owner calls `CrownFiCollectible.adminMint`.

## Local validation

```bash
npm install
npm run check
```

Tests run on Hardhat's OP Stack simulation and use a local mock token. Deployments use Circle's
official Base Sepolia USDC at `0x036CbD53842c5426634e7929541eC2318f3dCF7e`; the mock is never deployed.

## Base Sepolia deployment

The safest setup is Hardhat's encrypted keystore:

```bash
npx hardhat keystore set BASE_SEPOLIA_DEPLOYER_PRIVATE_KEY
npm run deploy:base-sepolia
npm run deploy:ticket:base-sepolia
npm run deploy:collectible:base-sepolia
```

You may instead set `BASE_SEPOLIA_DEPLOYER_PRIVATE_KEY` in the process environment, but never paste
it into chat, commit it, or put it in a `NEXT_PUBLIC_*` variable. An ignored `evm/.env` copied from
`.env.example` is supported for this testnet deployment. The deployer needs Base Sepolia ETH.
By default the deployer becomes both contract owner and fee treasury, and the prediction fee is 2%.

Current Base Sepolia deployment (2026-09-08):

```env
NEXT_PUBLIC_BASE_PREDICTION_MARKET_ADDRESS="0x35f9E8AB0Db5a0e1A3484dF97B0aeE6fAEF7c2d2"
NEXT_PUBLIC_BASE_AUDIT_ANCHOR_ADDRESS="0xc7E6e385fCf5494cF740202c4E37fDD0977F0Be9"
NEXT_PUBLIC_BASE_TICKET_CONTRACT_ADDRESS="0xD1013c0dEd496B75eE8e07d723807A7939bA205c"
NEXT_PUBLIC_BASE_COLLECTIBLE_CONTRACT_ADDRESS="0xaBF95a64439adc98cAaB2AA05806a9dbbC79219A"
```

The collectible deployment registered candidate IDs 1–5 for Indonesia, Philippines, Vietnam,
Japan, and Thailand with the supplied immutable IPFS metadata CIDs. The contract started with zero
minted tokens. See `base-sepolia.deployment.json` for transaction hashes and configuration.

Review the supplied metadata JSON before the first mint and call `setCandidateMetadata` if a URI
needs correction. Metadata becomes frozen per candidate after minting starts. Testnet deployment
is not a security audit; obtain an
independent review before using real funds or moving to Base Mainnet.
