import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    '192.168.2.133',
    '192.168.2.133:3000',
    '192.168.2.199',
    '192.168.2.199:3000',
    '192.168.10.102',
    '192.168.10.102:3000',
    '*.local'
  ],
};

export default nextConfig;
