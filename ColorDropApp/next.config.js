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
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'porto/internal': false,
    };
    return config;
  },
};

module.exports = nextConfig;
