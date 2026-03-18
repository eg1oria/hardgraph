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
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{ kebabCase member }}',
    },
  },
  experimental: {
    // Optimize package imports — tree-shake heavy libraries
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts', '@xyflow/react'],
    // Inline critical CSS with critters
    optimizeCss: true,
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
      {
        // Immutable cache for hashed static assets
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache fonts for 1 year
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          // Separate heavy chart library (recharts) — async-only so it's not
          // eagerly preloaded on pages that don't use charts
          recharts: {
            test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
            name: 'recharts',
            chunks: 'async',
            priority: 30,
          },
          // Separate React Flow — async-only so editor-specific code doesn't
          // block non-editor pages
          xyflow: {
            test: /[\\/]node_modules[\\/]@xyflow[\\/]/,
            name: 'xyflow',
            chunks: 'async',
            priority: 30,
          },
          // Separate framer-motion — async-only, used only on scan/onboarding/admin
          framerMotion: {
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            name: 'framer-motion',
            chunks: 'async',
            priority: 30,
          },
          // Core framework chunk
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
            name: 'framework',
            chunks: 'all',
            priority: 40,
          },
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
