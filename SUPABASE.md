# CrownFi: fresh Supabase + Privy + Base Sepolia

These are three separate layers:

- **Supabase Postgres** stores CrownFi application data such as fans, votes, pageants, markets, purchases, and audit receipts.
- **Privy** authenticates email/Google users and automatically creates their embedded EVM wallet.
- **Base Sepolia** is the EVM test network used for development contracts and test USDC. Supabase does not run on Base Sepolia.

## 1. Create a new Supabase project

Create a blank project in the Supabase dashboard. Do not reuse the connection strings from the previous CrownFi project.

Open **SQL Editor**, paste [web/supabase/schema.sql](web/supabase/schema.sql), and run it once. The script is for an empty project and includes the current tables, indexes, unique constraints, ownership foreign keys, and RLS lockdown.

The supplied old SQL was not safe to reuse directly because it was a context-only dump. In particular, it omitted several application constraints and did not include a stable Privy identity key. The new schema adds:

- unique `Fan.privyUserId` for Privy DID linkage;
- foreign keys for pageant owners, market creators, predictions, payment logs, and KYC logs;
- the vote, task, collectible, and pageant uniqueness rules from Prisma;
- indexes used by the current queries;
- RLS enabled with no browser policies, because the app accesses the database through trusted Next.js/Prisma server routes.

## 2. Add the new database URLs

From **Supabase → Connect**, copy the project’s pooler connection strings into `web/.env` locally and the same variables into Vercel:

```dotenv
# Vercel/serverless application traffic: Supavisor transaction pooler, port 6543
DATABASE_URL="postgresql://postgres.<project-ref>:<encoded-password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Schema operations/migrations: Supavisor session pooler, port 5432
DIRECT_URL="postgresql://postgres.<project-ref>:<encoded-password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

Percent-encode special characters in the database password. Keep both URLs server-only. CrownFi does not need a Supabase publishable key or service-role key because it uses Prisma on the server, not the browser Data API.

## 3. Configure Privy for web2 users

Create a Privy app and enable **Email** and **Google** login. Add `http://localhost:3000` and the deployed CrownFi URL as allowed origins, then set:

```dotenv
NEXT_PUBLIC_PRIVY_APP_ID="your-privy-app-id"
PRIVY_APP_ID="your-privy-app-id"
PRIVY_APP_SECRET="your-server-only-privy-secret"
```

The client automatically creates an Ethereum/EVM embedded wallet for users who sign in without a wallet. The server verifies Privy’s identity token, links the Privy DID to `Fan.privyUserId`, and stores the EVM address in `Fan.walletAddress`.

Never expose `PRIVY_APP_SECRET` with a `NEXT_PUBLIC_` prefix.

## 4. Keep Base Sepolia as the test chain

```dotenv
NEXT_PUBLIC_BASE_NETWORK="sepolia"
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
NEXT_PUBLIC_BASE_USDC_ADDRESS="0x036CbD53842c5426634e7929541eC2318f3dCF7e"
```

The Privy embedded wallet is an EVM wallet configured for Base Sepolia.

## 5. Verify and seed

From `web/`:

```bash
npx prisma validate
npx prisma generate
npm run seed
npm run dev
```

The SQL file is the one-time baseline for the new project. Keep future database changes in reviewed Prisma migrations or explicit SQL migrations; do not rerun the baseline on a populated database.
