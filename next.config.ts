import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  serverExternalPackages: [
    '@mapbox/node-pre-gyp',
    'nsfwjs',
    'canvas',
  ],
};

export default nextConfig;
