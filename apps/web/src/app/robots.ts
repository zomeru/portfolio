import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/api/v1",
        "/api/mcp",
        "/openapi.json",
        "/.well-known/",
        "/llms.txt",
        "/llms-full.txt",
        "/developers",
      ],
      disallow: ["/admin", "/api/admin", "/api/ai", "/api/blog", "/api/github"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).href,
  };
}
