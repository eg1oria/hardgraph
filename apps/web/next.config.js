/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.STANDALONE === '1' ? 'standalone' : undefined,
  transpilePackages: ['@hardgraph/ui', '@hardgraph/types'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  compiler: {
    // Remove console.log in production for smaller bundles
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  experimental: {
    // Optimize package imports — tree-shake heavy libraries
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts', '@xyflow/react'],
  },
  async headers() {
    return [
      {
        // Allow embed pages to be loaded in iframes on any origin
        source: '/embed/:path*',
        headers: [
          { key: 'X-Frame-Options', value: '' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
