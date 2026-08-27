import {
  getPublicPortfolioSnapshot,
  type PublicBlogPostSummary,
} from "@portfolio/api/public-portfolio";
import type { MetadataRoute } from "next";

import { defaultLocale, languageAlternates, localizedPath } from "@/i18n/routing";
import { siteUpdatedAt, siteUrl } from "@/lib/metadata";

const localizedPages = [
  { path: "/", priority: 1 },
  { path: "/projects", priority: 0.9 },
  { path: "/blogs", priority: 0.9 },
  { path: "/github-contributions", priority: 0.8 },
  { path: "/ask", priority: 0.8 },
  { path: "/contact", priority: 0.8 },
  { path: "/developers", priority: 0.8 },
] as const;

const machinePages = [
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
  const absoluteAlternates = (path: string) => ({
    languages: Object.fromEntries(
      Object.entries(languageAlternates(path)).map(([locale, localized]) => [
        locale,
        new URL(localized, baseUrl).href,
      ]),
    ),
  });

  return [
    ...localizedPages.map(({ path, priority }) => {
      return {
        alternates: absoluteAlternates(path),
        changeFrequency: "monthly" as const,
        lastModified: siteUpdatedAt,
        priority,
        url: new URL(localizedPath(path, defaultLocale), baseUrl).href,
      };
    }),
    ...machinePages.map(({ path, priority }) => ({
      changeFrequency: "monthly" as const,
      lastModified: siteUpdatedAt,
      priority,
      url: new URL(path, baseUrl).href,
    })),
    ...blogPosts.map(({ date, slug }) => {
      const path = `/blogs/${slug}`;

      return {
        alternates: absoluteAlternates(path),
        changeFrequency: "yearly" as const,
        lastModified: new Date(date),
        priority: 0.6,
        url: new URL(localizedPath(path, defaultLocale), baseUrl).href,
      };
    }),
  ];
}
