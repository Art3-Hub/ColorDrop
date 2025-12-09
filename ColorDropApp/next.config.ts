import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@walletconnect/ethereum-provider'],
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],

  // Turbopack configuration (Next.js 16+ default bundler)
  turbopack: {},

  // TypeScript configuration - ignore type errors in dependencies
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
