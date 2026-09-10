# CrownFi

CrownFi is a pageant prediction-market platform built on Base. Fans can create markets, stake test USDC on outcomes, follow live crowd odds, and claim winnings after settlement.

> **Testnet only:** CrownFi currently runs on Base Sepolia. The prediction-market contract is unaudited and must not be used with real funds.

## Core product

* Community-created candidate, pageant, and Yes/No prediction markets
* Base wallet, Coinbase Wallet, MetaMask, email, and Google onboarding through Privy
* Base Sepolia USDC staking
* Pre-close unstaking
* Market cancellation and refunds
* Winner claims after settlement
* Admin-controlled market settlement
* Searchable market history

## Base Sepolia contract

| Contract                  | Address                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `CrownFiPredictionMarket` | [`0x35f9E8AB0Db5a0e1A3484dF97B0aeE6fAEF7c2d2`](https://sepolia.basescan.org/address/0x35f9E8AB0Db5a0e1A3484dF97B0aeE6fAEF7c2d2) |

Deployment transaction hashes and contract configuration are recorded in [`evm/base-sepolia.deployment.json`](evm/base-sepolia.deployment.json).

## What is on-chain

The `CrownFiPredictionMarket` contract manages the financial state of CrownFi prediction markets, including:

* Market creation
* USDC stakes
* Market status
* Market settlement
* Cancellation refunds
* Winner claims

Supabase stores application profiles, candidate data, market indexing, receipts, and UI history.

Keeping application and presentation data off-chain makes CrownFi responsive and avoids unnecessary blockchain storage costs, while Base holds the prediction-market financial state users need to verify.

## Stack

* Next.js 15, React 19, and TypeScript
* Privy, Wagmi, and Viem
* Supabase Postgres with Prisma
* Solidity and Hardhat 3
* Base Sepolia and USDC

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

The full Supabase baseline schema is available at [`web/supabase/schema.sql`](web/supabase/schema.sql). See [`SUPABASE.md`](SUPABASE.md) for connection-string setup.

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

ADMIN_WALLETS="secret"
NEXT_PUBLIC_ADMIN_WALLETS="secret"
ADMIN_SESSION_SECRET="secret"
FAN_SESSION_SECRET="secret"
```

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

## Important notes

The prediction-market contract charges the configured platform fee only on profit.

Market creators cannot settle their own markets. Settlement is controlled by the CrownFi owner account.

CrownFi is currently intended for testnet use only. Before any real-money deployment, the platform will require an independent smart-contract audit, legal and regulatory review, jurisdiction controls, production-grade monitoring, and appropriate security safeguards.
