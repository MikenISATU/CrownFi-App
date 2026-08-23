# CrownFi

CrownFi is a fan-engagement platform for pageant voting, prediction markets, digital collectibles, rewards, and future ticketing. The active application is a Next.js full-stack demo backed by Prisma and Supabase Postgres.

> **Current status — Base migration in progress:** CrownFi now targets **Base Sepolia**, but **no CrownFi smart contracts have been deployed to Base Sepolia yet**. Base Account, MetaMask, Privy onboarding, network configuration, and contract-address placeholders are ready. Contract-backed voting, anchoring, collectibles, prediction settlement, and tickets must remain disabled or marked as coming soon until the EVM contracts are written, tested, deployed, and verified.

This repository is suitable for development, demos, and product review. It is not production voting infrastructure, audited financial infrastructure, or ready for real-money markets.

## Migration status

| Area | Current status |
|---|---|
| Web application | Active — Next.js 15, React 19, TypeScript, and Tailwind CSS |
| Database | Active — Prisma with a new Supabase Postgres project |
| Base network | Configured for Base Sepolia by default |
| Wallets | Base Account and MetaMask connection available |
| Web2 onboarding | Privy email/Google login with an embedded EVM wallet; credentials required |
| Base voting contract | **Not deployed** |
| Base audit-anchor contract | **Not deployed** |
| Base collectible contract | **Not deployed** |
| Base prediction-market contract | **Not deployed** |
| Base ticket contract | **Not deployed** |
| Base Mainnet | Not enabled for production |
| Stellar/Soroban | Legacy prototype code only; not the active wallet or deployment target |

The configured Base Sepolia USDC address is Circle's existing test token address. It is not a CrownFi deployment and does not mean CrownFi's paid flows are live.

## What currently works

- Responsive CrownFi website and pageant discovery experience.
- Candidate, voting, leaderboard, rewards, prediction, receipt, and organizer interfaces.
- Next.js API routes with Prisma/Postgres persistence.
- Base Sepolia network configuration through Wagmi and Viem.
- Base Account and injected EVM wallet support, including MetaMask.
- Privy email/Google onboarding and automatic embedded EVM-wallet creation when configured.
- Wallet-signed CrownFi sessions and EVM-address-based admin allowlisting.
- Off-chain vote records, market records, user profiles, pageants, candidates, and application receipts.
- Merkle proof generation and receipt verification at the application layer.

Any UI that depends on a CrownFi Base contract must be treated as a preview until its contract address is configured.

## On-chain and off-chain boundaries

### Currently off-chain

- User profiles and Privy identity mappings.
- Pageants, candidates, voting rounds, and raw vote records.
- Prediction-market questions, options, positions, status, and application-controlled settlement records.
- Rewards, rankings, organizer data, payment logs, and KYC-provider references.
- Candidate and collectible metadata stored in Supabase, public application assets, or IPFS where configured.
- Merkle trees, vote receipts, tally hashes, and checkpoint data before anchoring.

### Planned for Base Sepolia

- Publishing closed-round Merkle roots and tally commitments through an audit-anchor contract.
- Collectible minting and ownership through an EVM collectible contract.
- Prediction escrow, resolution, refunds, and claims through a prediction-market contract.
- Verifiable ticket ownership and ticket-state transitions.
- USDC-based contract interactions after contract and security testing.

CrownFi does not need to publish every raw vote on-chain. The intended design keeps private and high-volume application data in Postgres while publishing compact proofs and ownership or settlement state to Base. Until the Base audit-anchor contract is deployed, receipt verification proves consistency with the application's generated Merkle data but is not yet independently anchored on Base.

## Current architecture

```mermaid
flowchart LR
  Fan[Fan]
  Wallet[Base Account / MetaMask]
  Privy[Privy email or Google]
  Web[Next.js application]
  API[Next.js API routes]
  DB[(Supabase Postgres)]
  Proofs[Merkle receipts and tallies]
  BaseContracts[Base Sepolia contracts<br/>not deployed]

  Fan --> Wallet
  Fan --> Privy
  Wallet --> Web
  Privy --> Web
  Web --> API
  API --> DB
  API --> Proofs
  Proofs -. future anchor .-> BaseContracts
  API -. future transactions .-> BaseContracts
```

## Repository layout

```text
.
├── web/                         # Active Next.js application
│   ├── prisma/                  # Prisma schema and seed data
│   ├── supabase/schema.sql      # Fresh Supabase database schema
│   ├── src/base/                # Base wallet, network, USDC, and address configuration
│   └── .env.base.example        # Base/Supabase/Privy environment template
├── contracts/                   # Legacy Stellar/Soroban contracts; not deployable to Base
├── docs/                        # Product and historical technical documentation
├── SUPABASE.md                  # Fresh Supabase setup guide
└── README.md                    # Current project status
```

Some files under `contracts/` and `docs/` still describe the former Stellar prototype. They are retained as implementation references and historical context, not as the current Base deployment state.

## Local setup

### Requirements

- Node.js 22 or the version used by CI.
- npm.
- A new Supabase project.
- A Privy application if email/Google onboarding is enabled.
- A Base-compatible browser wallet for external-wallet testing.

### 1. Install the application

```bash
cd web
cp .env.base.example .env
npm ci
```

On PowerShell, use `Copy-Item .env.base.example .env` instead of `cp`.

### 2. Create the Supabase database

1. Create a new Supabase project.
2. Open its SQL Editor.
3. Run `web/supabase/schema.sql` once.
4. Open the project's **Connect** panel and add the new connection strings to `web/.env`.

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:5432/postgres"
```

`DATABASE_URL` is the transaction-pooler URL used by the application and Vercel. `DIRECT_URL` is the session/direct URL used for schema and migration operations. Both must point to the new Supabase project.

See [`SUPABASE.md`](SUPABASE.md) for the complete setup instructions.

### 3. Configure Privy

Create an application in the Privy dashboard and set:

```env
NEXT_PUBLIC_PRIVY_APP_ID="your-privy-app-id"
PRIVY_APP_ID="your-privy-app-id"
PRIVY_APP_SECRET="your-server-only-app-secret"
```

Configure email and Google login methods and allow `http://localhost:3000` plus the deployed CrownFi domain. Never expose `PRIVY_APP_SECRET` in browser code or commit it to Git.

### 4. Keep Base on Sepolia

```env
NEXT_PUBLIC_BASE_NETWORK="sepolia"
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
NEXT_PUBLIC_BASE_USDC_ADDRESS="0x036CbD53842c5426634e7929541eC2318f3dCF7e"
```

The public RPC is acceptable for development but should be replaced with a dedicated provider before production.

Leave every CrownFi contract address empty for now:

```env
NEXT_PUBLIC_BASE_VOTE_CONTRACT_ADDRESS=""
NEXT_PUBLIC_BASE_AUDIT_ANCHOR_ADDRESS=""
NEXT_PUBLIC_BASE_COLLECTIBLE_CONTRACT_ADDRESS=""
NEXT_PUBLIC_BASE_PREDICTION_MARKET_ADDRESS=""
NEXT_PUBLIC_BASE_TICKET_CONTRACT_ADDRESS=""
```

Do not paste Stellar `C...` contract IDs into these fields. Base requires deployed EVM contract addresses in `0x...` format.

### 5. Start CrownFi

```bash
npx prisma generate
npm run seed
npm run dev
```

Open `http://localhost:3000`.

## Base contract work still required

The repository does not currently contain deployable Solidity, Foundry, or Hardhat implementations for the five planned Base contracts. Before any address is added to the environment:

1. Define the EVM interfaces and authorization model.
2. Implement the contracts in Solidity.
3. Add unit, invariant, and integration tests.
4. Review upgradeability, treasury, pause, refund, and admin controls.
5. Deploy to Base Sepolia from an encrypted deployer keystore.
6. Verify source code on BaseScan.
7. Add the verified `0x...` addresses to the environment.
8. Replace remaining legacy transaction routes with Viem-based Base calls.
9. Complete testnet QA before considering Base Mainnet.

Never place a deployer private key, wallet seed phrase, database password, or Privy App Secret in a `NEXT_PUBLIC_*` variable.

## Deploying the web app to Vercel

1. Import the repository and set the Vercel Root Directory to `web`.
2. Add the Supabase, Base, Privy, admin-session, and optional provider variables from `web/.env.base.example`.
3. Set `NEXT_PUBLIC_APP_ORIGIN` to the deployed CrownFi URL.
4. Keep `NEXT_PUBLIC_BASE_NETWORK=sepolia`.
5. Leave CrownFi Base contract addresses empty until verified deployments exist.
6. Redeploy after changing any `NEXT_PUBLIC_*` variable because it is included in the client build.

## Validation

Run the application checks from `web/`:

```bash
npm run typecheck
npm run test:merkle
npm run test:ticketing
npm run security:audit
```

The Rust checks under `contracts/` validate legacy Soroban code only. Passing them does not validate or deploy a Base contract.

## Security and product limitations

- No CrownFi Base contract has completed a security audit.
- No CrownFi Base contract is deployed on Sepolia or Mainnet.
- Prediction settlement is not trustless until the Base contract is deployed and integrated.
- Vote receipts are not Base-anchored until the audit-anchor contract is deployed.
- Collectibles and tickets do not have Base ownership records yet.
- In-memory challenges and rate limits remain appropriate only for development/demo use unless backed by shared infrastructure.
- Real-money prediction markets require legal review, licensing, jurisdiction controls, and production-grade KYC/AML systems.

## Near-term roadmap

| Phase | Work |
|---|---|
| Current | Complete Supabase migration, Privy onboarding, Base Sepolia wallets, and UI/API cleanup |
| Next | Design and implement EVM voting and audit-anchor contracts |
| Next | Implement collectible, prediction-market, and ticket contracts |
| Testnet | Deploy and verify all contracts on Base Sepolia; run end-to-end QA |
| Security | External review, multisig administration, monitoring, and incident procedures |
| Later | Consider staged Base Mainnet deployment only after testnet and security gates pass |

## Social

X: [@CrownFi_app](https://x.com/CrownFi_app)
