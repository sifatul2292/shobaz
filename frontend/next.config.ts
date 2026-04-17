import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Example: /product/edventure → /edventure
      // Add more rows here following the same pattern
      {
        source: '/product/:slug',
        destination: '/:slug',
        permanent: true, // 301 redirect (good for SEO)
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/upload/**',
      },
      {
        protocol: 'https',
        hostname: 'api.shobaz.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.alambook.com',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 3600,
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['react-icons'],
  },
};

export default nextConfig;