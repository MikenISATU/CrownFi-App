# CrownFi

CrownFi is a pageant prediction-market platform built on Base. Fans create markets, stake test USDC on outcomes, follow live crowd odds, and claim winnings after settlement.

> **Testnet only:** CrownFi currently runs on Base Sepolia. Contracts are unaudited and must not be used with real funds.

## Core product

- Community-created candidate, pageant, and Yes/No prediction markets
- Base wallet, Coinbase Wallet, MetaMask, email, and Google onboarding through Privy
- Base Sepolia USDC staking, pre-close unstaking, cancellation refunds, and winner claims
- Admin settlement plus a searchable market history
- Off-chain voting with compact Merkle and tally checkpoints published on Base

Tickets and collectibles have deployed testnet contracts, but their public checkout interfaces remain hidden until fulfillment is ready.

## Base Sepolia contracts

| Contract | Address |
| --- | --- |
| `CrownFiPredictionMarket` | [`0x35f9E8AB0Db5a0e1A3484dF97B0aeE6fAEF7c2d2`](https://sepolia.basescan.org/address/0x35f9E8AB0Db5a0e1A3484dF97B0aeE6fAEF7c2d2) |
Deployment transaction hashes and contract configuration are recorded in [`evm/base-sepolia.deployment.json`](evm/base-sepolia.deployment.json).

## What is on-chain

- Prediction-market creation, USDC stakes, market status, settlement, refunds, and claims
- Closed-round vote checkpoint roots and tally hashes
- Ticket and collectible ownership after their public fulfillment flows are enabled

Supabase stores application profiles, candidate data, market indexing, raw vote records, receipts, and UI history. Keeping raw votes and presentation data off-chain makes the app responsive and avoids unnecessary storage costs; Base holds the financial state and compact proofs users need to verify.

## Stack

- Next.js 15, React 19, and TypeScript
- Privy, Wagmi, and Viem
- Supabase Postgres with Prisma
- Solidity and Hardhat 3
- Base Sepolia and USDC

## Local setup

Requirements: Node.js 20+ and a new Supabase project.

```bash
cd web
npm install
copy .env.base.example .env.local
```

Fill in `.env.local`, then initialize and start the app:

```bash
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

For a clean Supabase project, the full baseline is available at [`web/supabase/schema.sql`](web/supabase/schema.sql). See [`SUPABASE.md`](SUPABASE.md) for the connection-string setup.

Important environment variables:

```dotenv
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

NEXT_PUBLIC_PRIVY_APP_ID="..."
PRIVY_APP_ID="..."
PRIVY_APP_SECRET="..."

NEXT_PUBLIC_BASE_NETWORK="sepolia"
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
NEXT_PUBLIC_BASE_USDC_ADDRESS="0x036CbD53842c5426634e7929541eC2318f3dCF7e"
NEXT_PUBLIC_BASE_PREDICTION_MARKET_ADDRESS="0x35f9E8AB0Db5a0e1A3484dF97B0aeE6fAEF7c2d2"
NEXT_PUBLIC_BASE_AUDIT_ANCHOR_ADDRESS="0xc7E6e385fCf5494cF740202c4E37fDD0977F0Be9"
NEXT_PUBLIC_BASE_TICKET_CONTRACT_ADDRESS="0xD1013c0dEd496B75eE8e07d723807A7939bA205c"
NEXT_PUBLIC_BASE_COLLECTIBLE_CONTRACT_ADDRESS="0xaBF95a64439adc98cAaB2AA05806a9dbbC79219A"

ADMIN_WALLETS="0xYourPublicAdminAddress"
NEXT_PUBLIC_ADMIN_WALLETS="0xYourPublicAdminAddress"
ADMIN_SESSION_SECRET="generate-a-long-random-secret"
FAN_SESSION_SECRET="generate-a-different-long-random-secret"
```

Never place a wallet private key in `ADMIN_WALLETS`, `NEXT_PUBLIC_*`, the web environment, source control, or chat.

## Contract development

```bash
cd evm
npm install
npm run check
```

Deployment commands and owner-key handling are documented in [`evm/README.md`](evm/README.md).

## Validation

```bash
cd web
npm run check
npm run build
```

The prediction-market contract charges the configured fee only on profit. Market creators cannot settle their own markets; settlement stays with the CrownFi owner account. Real-money use requires an independent contract audit, legal review, jurisdiction controls, and production-grade monitoring.
