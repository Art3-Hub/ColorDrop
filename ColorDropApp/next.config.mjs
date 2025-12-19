/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow cross-origin requests from ngrok tunnel and production domain
  allowedDevOrigins: [
    'codalabs.ngrok.io',
    'colordrop.art3hub.xyz',
  ],
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
