import type { Metadata } from "next";
import { PageTransition } from "@/components/layout/page-transition";
import { MarkdownContent } from "@/components/portfolio/markdown-content";
import { getDeveloperGuideMarkdown } from "@/lib/developer-docs";
import { createPageMetadata, siteUrl } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Developers",
  description: "REST, OpenAPI, and MCP integration guide for the public portfolio API.",
  path: "/developers",
});

export default function DevelopersPage() {
  const canonicalSiteUrl = new URL(siteUrl);

  return (
    <PageTransition>
      <article>
        <MarkdownContent openLinksInNewTab value={getDeveloperGuideMarkdown(canonicalSiteUrl)} />
      </article>
    </PageTransition>
  );
}
