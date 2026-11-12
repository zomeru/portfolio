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
  const experienceLines = experience
    .map((job) => {
      const responsibilities =
        job.responsibilities
          .map((responsibility) => `  - ${responsibility.replaceAll("\n", " ")}`)
          .join("\n") || "  - Not specified";
      const details = job.details
        .map(
          (section) =>
            `  ${section.title}:\n${section.content.map((item) => `  - ${item.text.replaceAll("\n", " ")}`).join("\n")}`,
        )
        .join("\n");

      return `- ${job.role} at ${job.company}\n  URL: ${job.canonicalUrl}\n  Period: ${job.period}${job.location ? `\n  Location: ${job.location}` : ""}\n  Responsibilities:\n${responsibilities}\n  Technologies: ${job.technologies.join(", ") || "Not specified"}${details ? `\n  Details:\n${details}` : ""}`;
    })
    .join("\n\n");
  const projectLines = projects
    .map((project) => {
      const details = project.details
        .map(
          (section) =>
            `  ${section.title}:\n${section.content.map((item) => `  - ${item.text.replaceAll("\n", " ")}`).join("\n")}`,
        )
        .join("\n");

      return `- ${project.title}\n  URL: ${project.canonicalUrl}\n  Year: ${project.year}\n  Description: ${project.description}\n  Technologies: ${project.technologies.join(", ") || "Not specified"}${project.demoUrl ? `\n  Demo: ${project.demoUrl}` : ""}${project.repositoryUrl ? `\n  Repository: ${project.repositoryUrl}` : ""}${project.caseStudyUrl ? `\n  Case study: ${project.caseStudyUrl}` : ""}${details ? `\n  Details:\n${details}` : ""}`;
    })
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
        `- Title: ${post.title}\n  URL: ${new URL(`/blogs/${post.slug}`, getSiteUrl()).href}\n  Published: ${post.date}\n  Description: ${post.description}${post.tags?.length ? `\n  Tags: ${post.tags.join(", ")}` : ""}`,
    )
    .join("\n\n");
  const contactLines = [
    `- Website: ${getSiteUrl()}`,
    profile?.email ? `- Email: ${profile.email}` : null,
    profile ? `- GitHub: ${profile.links.github}` : null,
    profile ? `- LinkedIn: ${profile.links.linkedin}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  const content = `# ${name} — Full LLM Content Index

> Complete index of published portfolio content on ${getSiteUrl()}.
> Generated for AI and LLM ingestion. See ${new URL("/llms.txt", getSiteUrl()).href} for the summary index.

## About

- Author: ${name}
- Role: ${role}

## Key Sections

- [Home](${getSiteUrl()}): Portfolio overview with professional experience and skills
- [Projects](${new URL("/projects", getSiteUrl()).href}): Selected work and case studies
- [Blog](${new URL("/blogs", getSiteUrl()).href}): Technical writing on software engineering and web development
- [Zomer AI](${new URL("/ask", getSiteUrl()).href}): AI assistant for questions about Zomer's work, experience, projects, and writing
- [GitHub Contributions](${new URL("/github-contributions", getSiteUrl()).href}): GitHub contribution activity and commit history across owned repositories
- [Contact](${new URL("/contact", getSiteUrl()).href}): Ways to get in touch

## Structured Agent and Developer Access

- REST API index: ${new URL("/api/v1", getSiteUrl()).href}
- OpenAPI 3.2: ${new URL("/openapi.json", getSiteUrl()).href}
- Portfolio MCP (Streamable HTTP): ${new URL("/api/mcp", getSiteUrl()).href}
- Documentation MCP: ${new URL("/api/mcp/docs", getSiteUrl()).href}
- RFC 9727 API catalog: ${new URL("/.well-known/api-catalog", getSiteUrl()).href}
- Portfolio MCP server card: ${new URL("/.well-known/mcp/server-card.json", getSiteUrl()).href}
- Documentation MCP server card: ${new URL("/.well-known/mcp/docs-server-card.json", getSiteUrl()).href}
- Agent skills: ${new URL("/.well-known/agent-skills/index.json", getSiteUrl()).href}
- NLWeb schema map: ${new URL("/schemamap.xml", getSiteUrl()).href}
- Schema.org JSON Lines feed: ${new URL("/structured-data/portfolio.jsonl", getSiteUrl()).href}
- Developer guide: ${new URL("/developers.md", getSiteUrl()).href}
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
