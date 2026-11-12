import "@tanstack/react-start/server-only";
import { getPublicPortfolioSnapshot } from "@portfolio/api/public-portfolio";

import { languageAlternates, localizedPath, locales } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/metadata";

const localizedPages = [
  "/",
  "/projects",
  "/blogs",
  "/github-contributions",
  "/ask",
  "/contact",
  "/developers",
];
const machinePages = ["/developers.md", "/developers/llms.txt", "/llms.txt", "/llms-full.txt"];

async function sitemap() {
  const { blogs, experience, projects } = await getPublicPortfolioSnapshot();
  const siteUrl = getSiteUrl();
  const absolute = (path: string) => new URL(path, siteUrl).href;

  function localizedEntries(path: string, lastModified?: string) {
    const alternates = Object.entries(languageAlternates(path)).map(([locale, href]) => ({
      locale,
      href: absolute(href),
    }));
    return locales.map((locale) => ({
      url: absolute(localizedPath(path, locale)),
      alternates,
      lastModified,
    }));
  }

  return [
    ...localizedPages.flatMap((path) => localizedEntries(path)),
    ...machinePages.map((path) => ({
      url: absolute(path),
      alternates: [],
      lastModified: undefined,
    })),
    ...blogs.flatMap(({ slug }) => localizedEntries(`/blogs/${slug}`)),
    ...experience.flatMap(({ slug, updatedAt }) => localizedEntries(`/work/${slug}`, updatedAt)),
    ...projects.flatMap(({ slug, updatedAt }) => localizedEntries(`/projects/${slug}`, updatedAt)),
  ];
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const entries = await sitemap();
  const urls = entries.map(({ url, alternates, lastModified }) => {
    const links = alternates
      .map(
        ({ locale, href }) =>
          `<xhtml:link rel="alternate" hreflang="${escapeXml(locale)}" href="${escapeXml(href)}" />`,
      )
      .join("");
    const modified = lastModified
      ? `<lastmod>${new Date(lastModified).toISOString()}</lastmod>`
      : "";
    return `<url><loc>${escapeXml(url)}</loc>${modified}${links}</url>`;
  });
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join("")}</urlset>`,
    {
      headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-cache" },
    },
  );
}
