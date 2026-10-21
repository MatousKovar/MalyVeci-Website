import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produkční API ukládá média přes GitHub; public obsluhuje Vercel jako statické soubory.
  outputFileTracingExcludes: {
    "/api/admin/*": ["./public/**/*"],
    "/api/cron/*": ["./public/**/*"],
  },
};

export default nextConfig;
