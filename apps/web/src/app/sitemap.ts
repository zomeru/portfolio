import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/metadata";
import { getBlogPostSlugs } from "@/lib/sanity/services/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = await getBlogPostSlugs();
  const paths = ["/", "/projects", "/blogs", "/contact"];

  return [
    ...paths.map((path) => ({ url: new URL(path, siteUrl).href })),
    ...blogPosts.map(({ slug }) => ({ url: new URL(`/blogs/${slug}`, siteUrl).href })),
  ];
}
