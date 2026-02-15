import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: "top-right",
  },
  turbopack: {
    root: ".",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "places.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
