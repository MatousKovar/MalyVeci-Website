import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Média obsluhuje Vercel staticky; produkční změny souborů probíhají přes GitHub.
  outputFileTracingExcludes: {
    "/": ["./public/**/*"],
    "/admin": ["./public/**/*"],
    "/api/admin/*": ["./public/**/*"],
    "/api/cron/*": ["./public/**/*"],
  },
};

export default nextConfig;
