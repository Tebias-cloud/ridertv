import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Hardening for iPhone/Safari Compatibility
  transpilePackages: ['lucide-react', '@supabase/ssr'],
  experimental: {
    optimizeCss: false,
  },
};

export default nextConfig;
