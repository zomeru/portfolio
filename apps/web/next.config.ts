import { getSanityEnv } from "@portfolio/env/sanity";
import type { NextConfig } from "next";

const sanityEnv = getSanityEnv();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: `/images/${sanityEnv.projectId}/${sanityEnv.dataset}/**`,
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
