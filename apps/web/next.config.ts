import { getSanityEnv } from "@portfolio/env/sanity";
import type { NextConfig } from "next";

const sanityEnv = getSanityEnv();

const securityHeaders = [
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
] as const;

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: [...securityHeaders] }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: `/images/${sanityEnv.projectId}/${sanityEnv.dataset}/**`,
      },
    ],
  },
  poweredByHeader: false,
  reactCompiler: true,
};

export default nextConfig;
