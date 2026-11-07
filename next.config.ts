import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a second dev server run alongside the first without sharing build output.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  /* config options here */
};

export default nextConfig;
