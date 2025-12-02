import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {},
  transpilePackages: ['@walletconnect/ethereum-provider'],
  experimental: {
    serverComponentsExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  },
};

export default nextConfig;
