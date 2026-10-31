import type { NextConfig } from "next";

// Static export: `npm run build` produces ./out, which scripts/serve.mjs serves
// from 127.0.0.1 with plain Node (no node_modules needed on the school laptop).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: false, // avoid double-mounting the WebGL canvas / physics in dev
};

export default nextConfig;
