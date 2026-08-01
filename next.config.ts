import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Title/description сразу в <head> — вкладки и SEO видят правильный title
  htmlLimitedBots: /.*/,
  experimental: {
    serverActions: {
      bodySizeLimit: "80mb",
    },
  },
};

export default nextConfig;
