import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), "canvas", "jsdom"];
    config.optimization.minimize = false;
    config.resolve.alias.canvas = false;

    return config;
  },
};

export default nextConfig;
