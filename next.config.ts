import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.EXPORT_MODE === 'true' ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
