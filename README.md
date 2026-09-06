# CrownFi

CrownFi is a fan-engagement platform for pageant voting, prediction markets, digital collectibles, rewards, and future ticketing. The active application is a Next.js full-stack demo backed by Prisma and Supabase Postgres.

> **Current status — Base Sepolia testnet:** CrownFi now targets **Base Sepolia**. The prediction-market, audit-anchor, ticket, and collectible Solidity contracts are deployed. The web app includes Viem-based prediction-market and vote-proof anchoring flows; ticket sales and collectible checkout remain visibly locked while those fulfillment paths are migrated and reviewed.

This repository is suitable for development, demos, and product review. It is not production voting infrastructure, audited financial infrastructure, or ready for real-money markets.

## Migration status

| Area | Current status |
|---|---|
| Web application | Active — Next.js 15, React 19, TypeScript, and Tailwind CSS |
| Database | Active — Prisma with a new Supabase Postgres project |
| Base network | Configured for Base Sepolia by default |
| Wallets | Base Account and MetaMask connection available |
| Web2 onboarding | Privy email/Google login with an embedded EVM wallet; credentials required |
| Base voting contract | Not planned for raw votes — backend-first voting anchors compact proofs |
| Base audit-anchor contract | Deployed — admin close flow publishes and verifies the closed-round checkpoint |
| Base collectible contract | Deployed on Base Sepolia — five candidates registered, no tokens minted |
| Base prediction-market contract | Deployed — create, stake, unstake, close, resolve, cancel, refund, and claim paths integrated |
| Base ticket contract | Deployed on Base Sepolia — purchase and check-in integration pending |
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
- Admin-signed Base market creation, closing, resolution, and cancellation.
- User-signed USDC approval, market staking, pre-close unstaking, winner claims, and cancellation refunds.
- Server-side validation of successful Base receipts and matching contract events before Supabase is updated.
- Admin-signed publication of closed-round Merkle roots and tally commitments to the deployed audit anchor.

The deployed prediction contract currently has no created markets, so a real wallet stake cannot be tested until an admin creates the first Base Sepolia market. Automated contract and application-flow tests do not replace a security audit or wallet-based testnet QA.

## On-chain and off-chain boundaries

### Currently off-chain

- User profiles and Privy identity mappings.
- Pageants, candidates, voting rounds, and raw vote records.
- Prediction-market questions, options, positions, and status mirrors used by the UI; USDC escrow and final settlement are authoritative on Base.
- Rewards, rankings, organizer data, payment logs, and KYC-provider references.
- Candidate and collectible metadata stored in Supabase, public application assets, or IPFS where configured.
- Merkle trees, vote receipts, tally hashes, and checkpoint data before anchoring.

### Deployed on Base Sepolia

- Closed-round Merkle roots and tally commitments published through the audit-anchor contract.
- Prediction-market creation, USDC escrow, resolution, cancellation, refunds, and claims.
- Collectible minting and ownership through an EVM collectible contract.
- Verifiable ticket ownership and ticket-state transitions.

CrownFi does not deploy a raw-vote smart contract. Votes remain fast and inexpensive in Postgres; when a round closes, the admin publishes its Merkle root, tally hash, and vote count to `CrownFiAuditAnchor`. Prediction-market USDC, by contrast, is escrowed and settled directly by `CrownFiPredictionMarket`. This keeps high-volume vote data off-chain while making closed tallies and market settlement independently checkable on Base.

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
  BaseContracts[Prediction + audit + ticket + collectible<br/>deployed on Base Sepolia]

  Fan --> Wallet
  Fan --> Privy
  Wallet --> Web
  Privy --> Web
  Web --> API
  API --> DB
  API --> Proofs
  Proofs -->|closed-round checkpoint| BaseContracts
  API <-->|verified market events| BaseContracts
```

## Repository layout

```text
.
├── web/                         # Active Next.js application
│   ├── prisma/                  # Prisma schema and seed data
│   ├── supabase/schema.sql      # Fresh Supabase database schema
│   ├── src/base/                # Base wallet, network, USDC, and address configuration
│   └── .env.base.example        # Base/Supabase/Privy environment template
├── evm/                         # Hardhat 3 Base contracts, tests, and deployment module
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

The Privy Application ID is exactly 25 characters. In a local `.env` file the quotes above are valid,
but in the Vercel Environment Variables UI paste only the raw value with **no surrounding quotes or
whitespace**. Use the Application ID for both App ID variables; do not substitute a client ID, App
Secret, or the example placeholder. If the public App ID is missing or malformed, CrownFi now keeps
Base Account and MetaMask available while disabling only Privy email/Google login instead of failing
the entire Next.js prerender.

### 4. Keep Base on Sepolia

```env
NEXT_PUBLIC_BASE_NETWORK="sepolia"
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
NEXT_PUBLIC_BASE_USDC_ADDRESS="0x036CbD53842c5426634e7929541eC2318f3dCF7e"
```

The public RPC is acceptable for development but should be replaced with a dedicated provider before production.

Add the public Base address of each admin to both allowlists. These are wallet addresses,
not private keys. The server issues a 15-minute admin session only after the allowlisted
wallet signs a Base-bound challenge.

```env
ADMIN_WALLETS="0xYourPublicAdminAddress"
NEXT_PUBLIC_ADMIN_WALLETS="0xYourPublicAdminAddress"
ADMIN_SESSION_SECRET="generate-a-random-secret"
NEXT_PUBLIC_APP_ORIGIN="http://localhost:3000"
```

Use comma-separated addresses for multiple admins. `ADMIN_WALLETS` is enforced server-side;
`NEXT_PUBLIC_ADMIN_WALLETS` is only a client-side UI hint. Never put a private key or seed phrase
in either value. Set `NEXT_PUBLIC_APP_ORIGIN` to the exact HTTPS Vercel origin in production.

The prediction-market, audit-anchor, ticket, and collectible contracts are deployed on Base Sepolia.
Raw votes remain backend-first, so only the vote-contract address stays empty:

```env
NEXT_PUBLIC_BASE_VOTE_CONTRACT_ADDRESS=""
NEXT_PUBLIC_BASE_AUDIT_ANCHOR_ADDRESS="0xc7E6e385fCf5494cF740202c4E37fDD0977F0Be9"
NEXT_PUBLIC_BASE_COLLECTIBLE_CONTRACT_ADDRESS="0xaBF95a64439adc98cAaB2AA05806a9dbbC79219A"
NEXT_PUBLIC_BASE_PREDICTION_MARKET_ADDRESS="0x692c12283C2339021733a88Ba129556Ce73eff9c"
NEXT_PUBLIC_BASE_TICKET_CONTRACT_ADDRESS="0xD1013c0dEd496B75eE8e07d723807A7939bA205c"
```

Do not paste Stellar `C...` contract IDs into these fields. Base requires deployed EVM contract addresses in `0x...` format.

### Fund a Base Sepolia test wallet

Open `/funds` in CrownFi or use these provider pages directly:

- Test ETH for gas: [Alchemy Base Sepolia faucet](https://www.alchemy.com/faucets/base-sepolia), [Coinbase Developer Platform faucet](https://portal.cdp.coinbase.com/products/faucet), or the [Base funding guide](https://docs.base.org/get-started/get-funds).
- Test USDC for prediction stakes: [Circle's public faucet](https://faucet.circle.com/) or the [Coinbase Developer Platform faucet](https://portal.cdp.coinbase.com/products/faucet). Select **Base Sepolia** and **USDC**.

Use the direct USDC faucet instead of swapping test ETH. A testnet DEX may issue or route through a different mock token that the CrownFi prediction contract will reject. CrownFi accepts Circle's Base Sepolia test USDC at `0x036CbD53842c5426634e7929541eC2318f3dCF7e`.

### 5. Start CrownFi

```bash
npx prisma generate
npm run seed
npm run dev
```

Open `http://localhost:3000`.

## Base Sepolia deployment and remaining integration

The prediction-market, audit-anchor, ticket, and collectible contracts under `evm/` were deployed to Base Sepolia on
2026-08-29. The public deployment manifest is `evm/base-sepolia.deployment.json`.

Remaining work before treating the testnet release as production-ready:

1. Rotate the exposed test deployer and transfer ownership to a fresh wallet or multisig.
2. Perform an independent contract review, with prediction escrow and settlement as the priority.
3. Verify all four contract sources on BaseScan.
4. Create the first testnet market and run wallet-based staking, unstaking, settlement, cancellation, refund, claim, and proof-anchor QA against Supabase.
5. Replace the locked ticket and collectible fulfillment routes with reviewed Base-native services.
6. Complete legal review before any real-money market or Base Mainnet launch.

Never place a deployer private key, wallet seed phrase, database password, or Privy App Secret in a `NEXT_PUBLIC_*` variable.

## Deploying the web app to Vercel

1. Import the repository and set the Vercel Root Directory to `web`.
2. Add the Supabase, Base, Privy, admin-session, and optional provider variables from `web/.env.base.example`.
3. Set `NEXT_PUBLIC_APP_ORIGIN` to the deployed CrownFi URL.
4. Keep `NEXT_PUBLIC_BASE_NETWORK=sepolia`.
5. Use the deployed Base Sepolia prediction-market, audit-anchor, ticket, and collectible addresses from `web/.env.base.example`.
6. Redeploy after changing any `NEXT_PUBLIC_*` variable because it is included in the client build.

When entering values in Vercel, do not include the `KEY=` portion or `.env` quotes. Apply the variables
to Production and Preview as needed, then trigger a fresh deployment. At minimum, double-check:

- `NEXT_PUBLIC_PRIVY_APP_ID`: the 25-character Privy Application ID.
- `PRIVY_APP_ID`: the same Application ID.
- `PRIVY_APP_SECRET`: the server-only App Secret.
- `NEXT_PUBLIC_APP_ORIGIN`: the exact deployed `https://...` origin, without a trailing path.
- `DATABASE_URL` and `DIRECT_URL`: the new Supabase pooler and direct/session URLs.

Do not reuse an old local `web/.env.vercel` created during the Stellar version. That file is intentionally
gitignored and may still contain obsolete Stellar names. Use the tracked `web/.env.base.example` as the
current source of truth for Base deployments.

## Validation

Run the application checks from `web/`:

```bash
npm run check
npm run security:audit
```

Run the Base contract checks from `evm/`:

```bash
npm ci
npm run check
```

The Rust checks under `contracts/` validate legacy Soroban code only. Passing them does not validate or deploy a Base contract.

## Security and product limitations

- No CrownFi Base contract has completed a security audit.
- The prediction-market, audit-anchor, ticket, and collectible contracts are deployed only on Base Sepolia, not Base Mainnet.
- Prediction transaction paths are integrated, but the deployed contract has no market yet and has not completed wallet-based end-to-end QA against the new Supabase database.
- Raw votes are deliberately off-chain. Only a closed round's compact Merkle/tally checkpoint is published to Base.
- Tickets have a Base Sepolia ERC-721 contract, but purchases and seat assignment are not live until the web flow is integrated and tested.
- The collectible contract has five registered IPFS metadata records and zero initial mints, but the web purchase fulfillment route is not yet migrated from the legacy Stellar helper.
- In-memory challenges and rate limits remain appropriate only for development/demo use unless backed by shared infrastructure.
- Real-money prediction markets require legal review, licensing, jurisdiction controls, and production-grade KYC/AML systems.

## Near-term roadmap

| Phase | Work |
|---|---|
| Current | Complete Supabase configuration, Privy onboarding, Base Sepolia wallets, and UI/API cleanup |
| Current | Review and BaseScan-verify the deployed prediction-market, audit-anchor, ticket, and collectible contracts |
| Testnet | Create the first market and complete wallet-based prediction and vote-anchor QA |
| Testnet | Replace legacy collectible fulfillment with owner-authorized Base `adminMint` calls after payment confirmation |
| Security | External review, multisig administration, monitoring, and incident procedures |
| Later | Consider staged Base Mainnet deployment only after testnet and security gates pass |

## Social

X: [@CrownFi_app](https://x.com/CrownFi_app)
