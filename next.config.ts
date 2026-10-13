import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produkční API ukládá média přes GitHub; public obsluhuje Vercel jako statické soubory.
  outputFileTracingExcludes: {
    "/api/admin/*": ["./public/**/*"],
  },
};

export default nextConfig;
