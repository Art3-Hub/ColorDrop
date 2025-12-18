/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Server external packages
  serverExternalPackages: [
    'pino',
    'pino-pretty',
    'snarkjs',
    '@selfxyz/core',
    '@selfxyz/common',
  ],
  // Transpile WalletConnect packages for browser compatibility
  transpilePackages: [
    '@walletconnect/ethereum-provider',
    '@walletconnect/universal-provider',
  ],
  webpack: (config, { isServer }) => {
    // Fix for WalletConnect's pino logger in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // Suppress pino-pretty warning - it's optional and not needed in browser
      config.resolve.alias = {
        ...config.resolve.alias,
        'pino-pretty': false,
      };
    }
    return config;
  },
}

export default nextConfig
