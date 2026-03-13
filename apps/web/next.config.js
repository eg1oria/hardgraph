/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.STANDALONE === '1' ? 'standalone' : undefined,
  transpilePackages: ['@hardgraph/ui', '@hardgraph/types'],
};

module.exports = nextConfig;
