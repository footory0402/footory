import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ["@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"],
  images: {
    unoptimized: isDev,
    formats: ["image/webp"],
    qualities: [60, 75],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    deviceSizes: [320, 375, 414, 430, 768],
    imageSizes: [28, 36, 40, 48, 56, 120, 160, 200, 215, 398],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-d8652b9f924e49008171d003cf92a2be.r2.dev",
      },
      {
        protocol: "https",
        hostname: "vzsfsssmrcucyggyvpgu.supabase.co",
      },
      {
        protocol: "https",
        hostname: "r2.thesportsdb.com",
      },
      {
        protocol: "https",
        hostname: "www.thesportsdb.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-DNS-Prefetch-Control", value: "on" },
      ],
    },
    {
      source: "/api/((?!discover).*)",
      headers: [
        { key: "Cache-Control", value: "private, no-cache" },
      ],
    },
    {
      // Static assets
      source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2|ttf)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default nextConfig;
