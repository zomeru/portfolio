const PRIVATE_PATHS = ["/admin", "/api/admin", "/api/ai", "/api/blog", "/api/github"];

function crawlerGroup(userAgent: string) {
  return [
    `User-agent: ${userAgent}`,
    "Allow: /",
    ...PRIVATE_PATHS.map((path) => `Disallow: ${path}`),
  ].join("\n");
}

export function getRobotsText(siteUrl: URL) {
  const groups = crawlerGroup("*");
  const sitemap = new URL("/sitemap.xml", siteUrl).href;
  const schemaMap = new URL("/schemamap.xml", siteUrl).href;

  return `${groups}\n\nSitemap: ${sitemap}\n# Schemamap: ${schemaMap}\n`;
}
