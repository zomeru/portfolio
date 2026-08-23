import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/metadata";
import { getBlogPostSlugs } from "@/lib/sanity/services/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = await getBlogPostSlugs();
  const paths = new Set([
    "/",
    "/projects",
    "/blogs",
    "/ask",
    "/contact",
    "/llms.txt",
    "/llms-full.txt",
  ]);

  return [
    ...Array.from(paths, (path) => ({ url: new URL(path, siteUrl).href })),
    ...blogPosts.map(({ slug }) => ({ url: new URL(`/blogs/${slug}`, siteUrl).href })),
  ];
}
