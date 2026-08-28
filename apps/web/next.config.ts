import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 — native modul, server tomonda ishlatiladi.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
