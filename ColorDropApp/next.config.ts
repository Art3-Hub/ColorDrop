import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [],
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],

  // Turbopack configuration (Next.js 16+ default bundler)
  turbopack: {},

  // TypeScript configuration - ignore type errors in dependencies
  typescript: {
    ignoreBuildErrors: true,
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Ignore optional wallet connector dependencies that aren't used in our app
    // We only use Reown AppKit which handles WalletConnect internally
    config.resolve.alias = {
      ...config.resolve.alias,
      '@solana/kit': false,
      '@coinbase/cdp-sdk': false,
      '@coinbase/wallet-sdk': false,
      '@metamask/sdk': false,
      '@gemini-wallet/core': false,
      'porto': false,
      '@walletconnect/ethereum-provider': false,
    };

    // Fallback for node modules not available in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;
