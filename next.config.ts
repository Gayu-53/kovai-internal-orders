import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sdchfqmwbahzumsjwvkl.supabase.co",
      },
    ],
  },
};

export default nextConfig;