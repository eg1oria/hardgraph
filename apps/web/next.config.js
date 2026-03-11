/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.STANDALONE === '1' ? 'standalone' : undefined,
  transpilePackages: ['@skillgraph/ui', '@skillgraph/types'],
  allowedDevOrigins: ['172.20.10.5'],
};

module.exports = nextConfig;
