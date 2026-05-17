import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
  outputFileTracingIncludes: {
    "/*": ["./lib/documents/templates/**/*.docx"],
  },
  async redirects() {
    return [
      {
        source: "/wiedza",
        destination: "/twoje-prawa",
        permanent: true,
      },
      {
        source: "/wiedza/:path*",
        destination: "/twoje-prawa/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
