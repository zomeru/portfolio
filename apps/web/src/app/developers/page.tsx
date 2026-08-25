import type { Metadata } from "next";
import { McpInspectorCommandTabs } from "@/components/developers/mcp-inspector-command-tabs";
import { PageTransition } from "@/components/layout/page-transition";
import { MarkdownContent } from "@/components/portfolio/markdown-content";
import { getDeveloperGuideMarkdownParts, getMcpInspectorCommandGroups } from "@/lib/developer-docs";
import { createPageMetadata, siteUrl } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Developers",
  description: "REST, OpenAPI, and MCP integration guide for the public portfolio API.",
  path: "/developers",
});

export default function DevelopersPage() {
  const canonicalSiteUrl = new URL(siteUrl);
  const { afterInspector, beforeInspector } = getDeveloperGuideMarkdownParts(canonicalSiteUrl);

  return (
    <PageTransition>
      <article>
        <MarkdownContent value={beforeInspector} />
        <McpInspectorCommandTabs groups={getMcpInspectorCommandGroups(canonicalSiteUrl)} />
        <div className="mt-9">
          <MarkdownContent value={afterInspector} />
        </div>
      </article>
    </PageTransition>
  );
}
