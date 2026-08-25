import {
  getPublicPortfolioSnapshot,
  type PublicBlogPostSummary,
} from "@portfolio/api/public-portfolio";
import type { MetadataRoute } from "next";

import { siteUpdatedAt, siteUrl } from "@/lib/metadata";

const pages = [
  { path: "/", priority: 1 },
  { path: "/projects", priority: 0.9 },
  { path: "/blogs", priority: 0.9 },
  { path: "/github-contributions", priority: 0.8 },
  { path: "/ask", priority: 0.8 },
  { path: "/contact", priority: 0.8 },
  { path: "/developers", priority: 0.8 },
  { path: "/developers.md", priority: 0.6 },
  { path: "/developers/llms.txt", priority: 0.6 },
  { path: "/llms.txt", priority: 0.6 },
  { path: "/llms-full.txt", priority: 0.6 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = (await getPublicPortfolioSnapshot()).blogs;

  return getSitemapEntries(blogPosts);
}

export function getSitemapEntries(
  blogPosts: PublicBlogPostSummary[],
  baseUrl = siteUrl,
): MetadataRoute.Sitemap {
  return [
    ...pages.map(({ path, priority }) => ({
      changeFrequency: "monthly" as const,
      lastModified: siteUpdatedAt,
      priority,
      url: new URL(path, baseUrl).href,
    })),
    ...blogPosts.map(({ date, slug }) => ({
      changeFrequency: "yearly" as const,
      lastModified: new Date(date),
      priority: 0.7,
      url: new URL(`/blogs/${slug}`, baseUrl).href,
    })),
  ];
}
