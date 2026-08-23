import { siteUrl } from "@/lib/metadata";
import { portableTextToPlainText } from "@/lib/sanity/portable-text";
import { getBlogPosts } from "@/lib/sanity/services/blog";
import { getExperience } from "@/lib/sanity/services/experience";
import { getProfile } from "@/lib/sanity/services/profile";
import { getProjects } from "@/lib/sanity/services/projects";

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const [profile, experience, projects, posts] = await Promise.all([
    getProfile(),
    getExperience(),
    getProjects(),
    getBlogPosts(),
  ]);
  const name = profile?.name || "Portfolio";
  const role = profile?.role || "Software Engineer";
  const experienceLines = experience
    .map((job) => {
      const responsibilities =
        portableTextToPlainText(job.responsibilities)
          .split("\n\n")
          .filter(Boolean)
          .map((responsibility) => `  - ${responsibility.replaceAll("\n", " ")}`)
          .join("\n") || "  - Not specified";

      return `- ${job.role} at ${job.company}\n  Period: ${job.period}\n  Responsibilities:\n${responsibilities}\n  Technologies: ${job.technologies?.join(", ") || "Not specified"}`;
    })
    .join("\n\n");
  const projectLines = projects
    .map(
      (project) =>
        `- ${project.title}\n  Year: ${project.year}\n  Description: ${project.description}\n  Technologies: ${project.technologies.join(", ") || "Not specified"}${project.demoUrl ? `\n  Demo: ${project.demoUrl}` : ""}${project.repositoryUrl ? `\n  Repository: ${project.repositoryUrl}` : ""}${project.caseStudyUrl ? `\n  Case study: ${project.caseStudyUrl}` : ""}`,
    )
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
    profile?.githubUrl ? `- GitHub: ${profile.githubUrl}` : null,
    profile?.linkedinUrl ? `- LinkedIn: ${profile.linkedinUrl}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  const content = `# ${name} — Full LLM Content Index

> Complete index of published portfolio content on ${siteUrl}.
> Generated for AI and LLM ingestion. See ${new URL("/llms.txt", siteUrl).href} for the summary index.

## About

- Author: ${name}
- Role: ${role}

## Public Pages

- [Home](${siteUrl}): Portfolio overview with professional experience and skills
- [Projects](${new URL("/projects", siteUrl).href}): Selected work and case studies
- [Blog](${new URL("/blogs", siteUrl).href}): Technical writing on software engineering and web development
- [Ask Zomer AI](${new URL("/ask", siteUrl).href}): AI assistant for questions about Zomer's work, experience, projects, and writing
- [GitHub Contributions](${new URL("/github-contributions", siteUrl).href}): GitHub contribution activity and commit history across owned repositories
- [Contact](${new URL("/contact", siteUrl).href}): Ways to get in touch

## Contact

${contactLines}

## Experience (${experience.length} total)

${experienceLines || "No experience entries published yet."}

## Projects (${projects.length} total)

${projectLines || "No projects published yet."}

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
