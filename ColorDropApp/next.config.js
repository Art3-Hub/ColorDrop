/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: [
      'pino',
      'pino-pretty',
      'snarkjs',
      '@selfxyz/core',
      '@selfxyz/common',
    ],
  },
};

module.exports = nextConfig;
