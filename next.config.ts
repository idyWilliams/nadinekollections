import type { NextConfig } from "next";

const deviceSizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const imageSizes = [16, 32, 48, 64, 96, 128, 256, 384];
const QUALITY = 75;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "coresg-normal.trae.ai",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes,
    imageSizes,
    qualities: Array.from({ length: deviceSizes.length + imageSizes.length }, () => QUALITY),
    minimumCacheTTL: 31536000,
  },
  transpilePackages: ["react-map-gl", "mapbox-gl"],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@supabase/supabase-js",
      "recharts",
      "react-hook-form",
    ],
  },
};

export default nextConfig;
