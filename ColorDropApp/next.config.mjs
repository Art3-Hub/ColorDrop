/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: [
    'pino',
    'pino-pretty',
    'snarkjs',
    '@selfxyz/core',
    '@selfxyz/common',
  ],
};

export default nextConfig;
