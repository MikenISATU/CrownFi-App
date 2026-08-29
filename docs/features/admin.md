# Admin and organizer flows

Admin flows are for organizers, tabulators, auditors, and hackathon reviewers. They must be guarded server-side. Frontend-only admin mode is not a security boundary.

## Current MVP admin protections

The MVP includes wallet-signed admin sessions:

- `web/src/app/api/admin/challenge/route.ts`
- `web/src/app/api/admin/verify/route.ts`
- `web/src/app/api/admin/logout/route.ts`
- `web/src/lib/adminAuth.ts`

The server checks a comma-separated Base EVM wallet allowlist and uses an EIP-191 signed,
origin- and chain-bound challenge to issue a 15-minute httpOnly session cookie. MetaMask EOAs
are verified locally; Base Account and other smart-wallet signatures use ERC-1271/ERC-6492-aware
verification through the configured Base RPC.

## Admin actions

Admin-facing flows include:

- create contestants;
- create/open/close voting rounds;
- compute and anchor snapshots;
- manage organizer requests;
- redeem/check in tickets;
- review ticketing/verification state.

## Security posture

For the hackathon MVP, admin security should be practical:

- use a strong `ADMIN_SESSION_SECRET`;
- restrict `ADMIN_WALLETS` to known team/admin wallets;
- keep `NEXT_PUBLIC_ADMIN_WALLETS` identical for UI discovery, but never treat it as authorization;
- use public `0x...` addresses only and never store private keys or seed phrases in these values;
- set `NEXT_PUBLIC_APP_ORIGIN` to the exact production HTTPS origin;
- run over HTTPS on the VPS;
- do not expose Postgres or Redis publicly;
- treat testnet wallets and demo data as disposable;
- do not collect sensitive real user data.

## Refactor target

In the platform refactor, admin APIs should move into `services/api` with structured errors, auth middleware, and explicit audit logs. Admin actions should record actor, action type, target entity, timestamp, and result.
