import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
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
        hostname: 'api.alambook.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;