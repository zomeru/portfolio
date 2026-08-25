import { getPublicPortfolioSnapshot } from "@portfolio/api/public-portfolio";
import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = (await getPublicPortfolioSnapshot()).blogs;
  const paths = new Set([
    "/",
    "/projects",
    "/blogs",
    "/github-contributions",
    "/ask",
    "/contact",
    "/developers",
    "/developers.md",
    "/developers/llms.txt",
    "/llms.txt",
    "/llms-full.txt",
  ]);

  return [
    ...Array.from(paths, (path) => ({ url: new URL(path, siteUrl).href })),
    ...blogPosts.map(({ slug }) => ({ url: new URL(`/blogs/${slug}`, siteUrl).href })),
  ];
}
