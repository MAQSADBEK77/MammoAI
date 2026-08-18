import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 ships a native (.node) binary — keep it out of the
  // server bundle and require() it directly at runtime instead.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
