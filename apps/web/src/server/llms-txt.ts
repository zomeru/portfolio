import "@tanstack/react-start/server-only";
import { getPublicPortfolioSnapshot } from "@portfolio/api/public-portfolio";

import { getSiteUrl } from "@/lib/metadata";

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
  const recentPostLines = posts
    .slice(0, 10)
    .map((post) => `- [${post.title}](${new URL(`/blogs/${post.slug}`, getSiteUrl()).href})`)
    .join("\n");
  const experienceLines = experience
    .map((job) => `- ${job.role} at ${job.company} (${job.period})`)
    .join("\n");
  const projectLines = projects
    .map((project) => `- ${project.title}: ${project.description}`)
    .join("\n");
  const techStackLines = techStack
    .map((group) => `- ${group.name}: ${group.items.join(", ")}`)
    .join("\n");
  const contactLines = [
    `- Website: ${getSiteUrl()}`,
    profile?.email ? `- Email: ${profile.email}` : null,
    profile ? `- GitHub: ${profile.links.github}` : null,
    profile ? `- LinkedIn: ${profile.links.linkedin}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  const content = `# ${name}

> Personal portfolio of ${name}, ${role}.

## Key Sections

- [Home](${getSiteUrl()}): Portfolio overview with professional experience and skills
- [Projects](${new URL("/projects", getSiteUrl()).href}): Selected work and case studies
- [Blog](${new URL("/blogs", getSiteUrl()).href}): Technical writing on software engineering and web development
- [Zomer AI](${new URL("/ask", getSiteUrl()).href}): AI assistant for questions about Zomer's work, experience, projects, and writing
- [GitHub Contributions](${new URL("/github-contributions", getSiteUrl()).href}): GitHub contribution activity and commit history across owned repositories
- [Contact](${new URL("/contact", getSiteUrl()).href}): Ways to get in touch

## Structured Agent and Developer Access

- [Public REST API](${new URL("/api/v1", getSiteUrl()).href}): Versioned JSON resources for profile, resume, experience, projects, blogs, and tech stack
- [OpenAPI 3.2](${new URL("/openapi.json", getSiteUrl()).href}): Complete REST contract
- [Portfolio MCP](${new URL("/api/mcp", getSiteUrl()).href}): Stateless Streamable HTTP MCP server
- [Documentation MCP](${new URL("/api/mcp/docs", getSiteUrl()).href}): API guide, authentication policy, and OpenAPI tools
- [API Catalog](${new URL("/.well-known/api-catalog", getSiteUrl()).href}): RFC 9727 Linkset discovery document
- [MCP Server Card](${new URL("/.well-known/mcp/server-card.json", getSiteUrl()).href}): MCP metadata and tool index
- [Documentation MCP Server Card](${new URL("/.well-known/mcp/docs-server-card.json", getSiteUrl()).href}): Documentation MCP metadata and tool index
- [Agent Skills](${new URL("/.well-known/agent-skills/index.json", getSiteUrl()).href}): Machine-readable capabilities
- [Schema Map](${new URL("/schemamap.xml", getSiteUrl()).href}): NLWeb index for structured schema feeds
- [Schema Feed](${new URL("/structured-data/portfolio.jsonl", getSiteUrl()).href}): Aggregated schema.org records as JSON Lines
- [Developer Guide](${new URL("/developers.md", getSiteUrl()).href}): REST and MCP integration instructions

## Contact

${contactLines}

## Experience

${experienceLines || "No experience entries published yet."}

## Projects

${projectLines || "No projects published yet."}

## Tech Stack

${techStackLines || "No tech stack groups published yet."}

## 10 Recent Blog Posts

${recentPostLines || "No blog posts published yet."}

## Full Content Index

For a complete list of all blog posts with descriptions, see: ${new URL("/llms-full.txt", getSiteUrl()).href}

`;

  return new Response(content, {
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
