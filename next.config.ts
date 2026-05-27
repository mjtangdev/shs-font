import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  // devIndicators: {
  //   appIsrStatus: false,
  //   buildActivity: false,
  // },
};

export default nextConfig;
