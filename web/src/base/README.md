# CrownFi Base migration foundation

This folder contains CrownFi's active EVM/Base wallet client while the remaining transaction routes are replaced feature by feature.

## What is ready

- Wagmi and Viem configuration for Base Sepolia and Base Mainnet.
- Base Account and injected-wallet connectors (for example MetaMask).
- A responsive Base wallet control with explicit network switching.
- Official native USDC addresses for Base and Base Sepolia.
- Empty contract-address slots for voting, audit anchoring, collectibles, predictions, and tickets.
- Base is the default visible wallet layer; users choose Base Account or MetaMask.

## Local setup

1. Copy `web/.env.base.example` values into `web/.env.local` or your deployment environment.
2. Keep `NEXT_PUBLIC_BASE_NETWORK=sepolia` until all contracts and transaction flows pass testnet QA.
3. Use a dedicated production RPC URL before mainnet. The public Base endpoints are rate-limited.
4. Deploy EVM versions of the CrownFi contracts and fill the five public contract addresses.
5. Keep paid actions marked as coming soon until their Base API routes replace the legacy signing paths.

## Wallet security

Fans connect their own wallets; no fan private key belongs in CrownFi environment variables. Do not create a `NEXT_PUBLIC_*` private-key variable. For contract deployment, use Foundry's encrypted keystore (`cast wallet import deployer --interactive`) or a managed production signer. Only addresses and public RPC URLs should reach the browser.
