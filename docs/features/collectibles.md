# Collectibles and contestant support

CrownFi includes ERC-721 digital memorabilia for pageant contestants. The purpose is fan engagement and contestant support, not increased voting power.

## Current Base Sepolia behavior

The app has collectible catalogue and purchase interfaces:

- `web/src/app/contestants/page.tsx`
- `web/src/app/api/collectibles/route.ts`
- `web/src/app/api/collectibles/prepare-buy/route.ts`
- `web/src/app/api/collectibles/confirm-buy/route.ts`
- `evm/contracts/CrownFiCollectible.sol`
- `evm/ignition/modules/CrownFiCollectible.ts`

The Base Sepolia collectible contract is deployed at
`0xaBF95a64439adc98cAaB2AA05806a9dbbC79219A`. Candidate IDs 1–5 are registered for Indonesia,
Philippines, Vietnam, Japan, and Thailand using the supplied Pinata/IPFS metadata. Each candidate
has a testnet cap of 1,000,000, while the contract permanently limits each wallet to one mint per
candidate. The collection started with zero minted tokens.

Minting is owner-authorized. CrownFi must confirm payment or entitlement before the backend calls
`adminMint`; the contract deliberately has no public free-mint function. Candidate metadata can be
corrected only before that candidate's first mint, after which it is frozen.

## Rule

Support and purchases must not multiply vote power. Use this framing:

> Support helps contestants financially and unlocks fan perks, but voting remains capped and fair.

## MVP limitations

- The current implementation is suitable for testnet/demo usage only and has not been audited.
- The active web fulfillment routes still use legacy Stellar helpers and must be replaced with
  server-authorized Base transactions before the UI can claim live Base minting.
- The supplied Pinata metadata currently describes each collectible as “on Stellar”; repin corrected
  Base metadata and update each candidate URI before its first mint if that wording should change.
- Real-money/mainnet support requires a deeper contract and backend review.
