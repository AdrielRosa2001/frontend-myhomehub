import type { NextConfig } from "next";

const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
} satisfies NextConfig;

export default nextConfig;
