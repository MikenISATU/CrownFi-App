# CrownFi architecture

The Next.js app in `web/` serves the product UI and trusted API routes. Supabase Postgres is accessed through Prisma on the server. Browser clients never receive database credentials.

Prediction-market financial state is held by `CrownFiPredictionMarket` on Base. Users approve USDC and submit market transactions from their connected or embedded wallet. API confirmation routes verify successful Base receipts before writing the corresponding index record to Postgres.

Voting remains fast and private by storing individual records in Postgres. When a round closes, CrownFi computes a Merkle root and tally hash and publishes the compact checkpoint through `CrownFiAuditAnchor`. A receipt can therefore prove inclusion without publishing every vote.

See [component boundaries](architecture/component-boundaries.md) for ownership rules and [transaction verification](blockchain/transaction-verification.md) for confirmation requirements.
