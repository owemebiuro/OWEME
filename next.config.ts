import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
  outputFileTracingIncludes: {
    "/*": ["./lib/documents/templates/**/*.docx"],
  },
};

export default nextConfig;
