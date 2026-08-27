import type { PublicPortfolioSnapshot } from "@portfolio/api/public-portfolio";

type SchemaRecord = Record<string, unknown>;

function projectId(slug: string, siteUrl: URL) {
  return new URL(`/projects/${slug}#project`, siteUrl).href;
}

export function getSchemaFeedRecords(
  snapshot: PublicPortfolioSnapshot,
  siteUrl: URL,
  siteUpdatedAt: Date,
): SchemaRecord[] {
  const { blogs, profile, projects, techStack } = snapshot;
  const personId = new URL("/#person", siteUrl).href;
  const websiteId = new URL("/#website", siteUrl).href;
  const profilePageId = new URL("/#profile-page", siteUrl).href;
  const records: SchemaRecord[] = [];

  if (profile) {
    records.push({
      "@context": "https://schema.org",
      "@id": personId,
      "@type": "Person",
      description: profile.biography,
      email: profile.email,
      image: profile.photo?.url,
      jobTitle: profile.role,
      knowsAbout: techStack.flatMap((group) => group.items),
      name: profile.name,
      sameAs: [profile.links.github, profile.links.linkedin],
      url: profile.url,
    });
  }

  records.push({
    "@context": "https://schema.org",
    "@id": websiteId,
    "@type": "WebSite",
    author: profile ? { "@id": personId } : undefined,
    description: profile?.biography ?? "Personal software engineering portfolio.",
    name: profile ? `${profile.name} Portfolio` : "Portfolio",
    url: siteUrl.href,
  });

  if (profile) {
    records.push({
      "@context": "https://schema.org",
      "@id": profilePageId,
      "@type": "ProfilePage",
      dateModified: siteUpdatedAt.toISOString(),
      description: profile.about || profile.biography,
      mainEntity: { "@id": personId },
      name: `${profile.name} — ${profile.role}`,
      url: siteUrl.href,
    });
  }

  records.push(
    ...projects.map((project) => ({
      "@context": "https://schema.org",
      "@id": projectId(project.slug, siteUrl),
      "@type": "CreativeWork",
      author: profile ? { "@id": personId } : undefined,
      dateCreated: project.year,
      description: project.description,
      image: project.image?.url,
      keywords: project.technologies,
      name: project.title,
      url: project.canonicalUrl,
    })),
    ...blogs.map((blog) => ({
      "@context": "https://schema.org",
      "@id": `${blog.canonicalUrl}#article`,
      "@type": "Article",
      author: profile ? { "@id": personId } : undefined,
      datePublished: blog.date,
      description: blog.description,
      headline: blog.title,
      keywords: blog.tags,
      mainEntityOfPage: blog.canonicalUrl,
      url: blog.canonicalUrl,
    })),
  );

  return records;
}

export function serializeSchemaFeed(records: SchemaRecord[]) {
  return `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function getSchemaMapXml(siteUrl: URL, siteUpdatedAt: Date) {
  const feedUrl = escapeXml(new URL("/structured-data/portfolio.jsonl", siteUrl).href);
  const lastModified = escapeXml(siteUpdatedAt.toISOString());

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:sf="http://schema.org/schemas/schemafeed/0.1">
  <url>
    <loc>${feedUrl}</loc>
    <lastmod>${lastModified}</lastmod>
    <sf:contentType>structuredData/schema.org</sf:contentType>
  </url>
</urlset>
`;
}
