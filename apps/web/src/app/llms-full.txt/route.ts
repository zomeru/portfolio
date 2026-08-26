import { getPublicPortfolioSnapshot } from "@portfolio/api/public-portfolio";

import { siteUrl } from "@/lib/metadata";

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const {
    blogs: posts,
    experience,
    profile,
    projects,
    techStack,
  } = await getPublicPortfolioSnapshot();
  const name = profile?.name || "Portfolio";
  const role = profile?.role || "Software Engineer";
  const experienceLines = experience
    .map((job) => {
      const responsibilities =
        job.responsibilities
          .map((responsibility) => `  - ${responsibility.replaceAll("\n", " ")}`)
          .join("\n") || "  - Not specified";

      return `- ${job.role} at ${job.company}\n  Period: ${job.period}${job.location ? `\n  Location: ${job.location}` : ""}\n  Responsibilities:\n${responsibilities}\n  Technologies: ${job.technologies.join(", ") || "Not specified"}`;
    })
    .join("\n\n");
  const projectLines = projects
    .map(
      (project) =>
        `- ${project.title}\n  Year: ${project.year}\n  Description: ${project.description}\n  Technologies: ${project.technologies.join(", ") || "Not specified"}${project.demoUrl ? `\n  Demo: ${project.demoUrl}` : ""}${project.repositoryUrl ? `\n  Repository: ${project.repositoryUrl}` : ""}${project.caseStudyUrl ? `\n  Case study: ${project.caseStudyUrl}` : ""}`,
    )
    .join("\n\n");
  const techStackLines = techStack
    .map((group) => {
      const items = group.items.map((item) => `  - ${item}`).join("\n") || "  - Not specified";

      return `- ${group.name}\n${items}`;
    })
    .join("\n\n");
  const postLines = posts
    .map(
      (post) =>
        `- Title: ${post.title}\n  URL: ${new URL(`/blogs/${post.slug}`, siteUrl).href}\n  Published: ${post.date}\n  Description: ${post.description}${post.tags?.length ? `\n  Tags: ${post.tags.join(", ")}` : ""}`,
    )
    .join("\n\n");
  const contactLines = [
    `- Website: ${siteUrl}`,
    profile?.email ? `- Email: ${profile.email}` : null,
    profile ? `- GitHub: ${profile.links.github}` : null,
    profile ? `- LinkedIn: ${profile.links.linkedin}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  const content = `# ${name} — Full LLM Content Index

> Complete index of published portfolio content on ${siteUrl}.
> Generated for AI and LLM ingestion. See ${new URL("/llms.txt", siteUrl).href} for the summary index.

## About

- Author: ${name}
- Role: ${role}

## Key Sections

- [Home](${siteUrl}): Portfolio overview with professional experience and skills
- [Projects](${new URL("/projects", siteUrl).href}): Selected work and case studies
- [Blog](${new URL("/blogs", siteUrl).href}): Technical writing on software engineering and web development
- [Ask Zomer AI](${new URL("/ask", siteUrl).href}): AI assistant for questions about Zomer's work, experience, projects, and writing
- [GitHub Contributions](${new URL("/github-contributions", siteUrl).href}): GitHub contribution activity and commit history across owned repositories
- [Contact](${new URL("/contact", siteUrl).href}): Ways to get in touch

## Structured Agent and Developer Access

- REST API index: ${new URL("/api/v1", siteUrl).href}
- OpenAPI 3.2: ${new URL("/openapi.json", siteUrl).href}
- Portfolio MCP (Streamable HTTP): ${new URL("/api/mcp", siteUrl).href}
- Documentation MCP: ${new URL("/api/mcp/docs", siteUrl).href}
- RFC 9727 API catalog: ${new URL("/.well-known/api-catalog", siteUrl).href}
- Portfolio MCP server card: ${new URL("/.well-known/mcp/server-card.json", siteUrl).href}
- Documentation MCP server card: ${new URL("/.well-known/mcp/docs-server-card.json", siteUrl).href}
- Agent skills: ${new URL("/.well-known/agent-skills/index.json", siteUrl).href}
- NLWeb schema map: ${new URL("/schemamap.xml", siteUrl).href}
- Schema.org JSON Lines feed: ${new URL("/structured-data/portfolio.jsonl", siteUrl).href}
- Developer guide: ${new URL("/developers.md", siteUrl).href}
- Authentication: none; clients SHOULD NOT send credentials

## Contact

${contactLines}

## Experience (${experience.length} total)

${experienceLines || "No experience entries published yet."}

## Projects (${projects.length} total)

${projectLines || "No projects published yet."}

## Tech Stack (${techStack.length} groups)

${techStackLines || "No tech stack groups published yet."}

## Blog Posts (${posts.length} total)

${postLines || "No blog posts published yet."}
`;

  return new Response(content, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
