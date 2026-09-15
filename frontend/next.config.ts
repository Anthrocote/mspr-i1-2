import type { NextConfig } from "next";

// Dev-only cross-origin allowlist. Kept out of the committed config: set
// DEV_ORIGINS (comma-separated, e.g. "192.168.1.20") to reach the dev server
// from another device on the LAN. Empty by default → localhost only.
const devOrigins = process.env.DEV_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  ...(devOrigins.length > 0 ? { allowedDevOrigins: devOrigins } : {}),
};

export default nextConfig;
