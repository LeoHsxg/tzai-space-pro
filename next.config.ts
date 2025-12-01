import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Outputs a Single-Page Application (SPA)
  distDir: "./dist", // Changes the build output directory to `build`
};

export default nextConfig;

// Note: Using output: 'export' means you’re doing a static export. You will not have access to server-side features like SSR or APIs. You can remove this line to leverage Next.js server features.
