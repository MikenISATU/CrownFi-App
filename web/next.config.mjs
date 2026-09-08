/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prisma is server-only; keep it external to the application bundle.
  serverExternalPackages: ["@prisma/client"],
  webpack: (config) => {
    // @privy-io/react-auth optionally references packages for features we don't use
    // (Farcaster/Solana login, Stripe crypto onramp). Alias the missing ones to empty modules
    // so the client bundle builds instead of failing with "Can't resolve '…'".
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@farcaster/mini-app-solana": false,
      "@react-native-async-storage/async-storage": false,
      "@stripe/crypto": false,
    };
    return config;
  },
};
export default nextConfig;
