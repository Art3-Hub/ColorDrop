import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@walletconnect/ethereum-provider'],
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
};

export default nextConfig;
