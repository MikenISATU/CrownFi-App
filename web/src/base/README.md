# CrownFi Base migration foundation

This folder contains CrownFi's active EVM/Base wallet client while the remaining transaction routes are replaced feature by feature.

## What is ready

- Wagmi and Viem configuration for Base Sepolia and Base Mainnet.
- Base Account plus explicit Coinbase Wallet and MetaMask connectors.
- A responsive Base wallet control with explicit network switching.
- Official native USDC addresses for Base and Base Sepolia.
- Configured Base Sepolia addresses for audit anchoring, collectibles, predictions, and tickets;
  the raw-vote slot intentionally remains empty.
- Base is the default visible wallet layer; users choose Base Account, Coinbase Wallet, or MetaMask.

## Local setup

1. Copy `web/.env.base.example` values into `web/.env.local` or your deployment environment.
2. Keep `NEXT_PUBLIC_BASE_NETWORK=sepolia` until all contracts and transaction flows pass testnet QA.
3. Use a dedicated production RPC URL before mainnet. The public Base endpoints are rate-limited.
4. Copy the four deployed public contract addresses from `web/.env.base.example`.
5. Keep paid actions marked as coming soon until their Base API routes replace the legacy signing paths.

## Wallet security

Fans connect their own wallets; no fan private key belongs in CrownFi environment variables. Do not create a `NEXT_PUBLIC_*` private-key variable. For contract deployment, use Foundry's encrypted keystore (`cast wallet import deployer --interactive`) or a managed production signer. Only addresses and public RPC URLs should reach the browser.
