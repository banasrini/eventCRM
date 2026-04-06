import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: [
    "@libsql/client",
    "@libsql/hrana-client",
    "@libsql/core",
    "@libsql/isomorphic-ws",
    "drizzle-orm",
  ],
};

export default nextConfig;
