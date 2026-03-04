import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ["@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"],
  images: {
    formats: ["image/avif", "image/webp"],
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
