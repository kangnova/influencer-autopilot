import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["43.156.225.212"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
