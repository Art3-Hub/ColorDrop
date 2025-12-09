import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@walletconnect/ethereum-provider'],
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],

  // Turbopack configuration (Next.js 16+ default bundler)
  turbopack: {},
};

export default nextConfig;
