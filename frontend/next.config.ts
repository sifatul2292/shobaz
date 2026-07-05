import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the Turbopack workspace root to this app. Without it Next 16 walks up
  // and infers the repo (or home) directory as root, breaking node_modules
  // resolution for CSS imports like `@import "tailwindcss"`.
  turbopack: { root: __dirname },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
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