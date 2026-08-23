import { siteUrl } from "@/lib/metadata";
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
  const recentPostLines = posts
    .slice(0, 10)
    .map((post) => `- [${post.title}](${new URL(`/blogs/${post.slug}`, siteUrl).href})`)
    .join("\n");
  const experienceLines = experience
    .map((job) => `- ${job.role} at ${job.company} (${job.period})`)
    .join("\n");
  const projectLines = projects
    .map((project) => `- ${project.title}: ${project.description}`)
    .join("\n");
  const contactLines = [
    `- Website: ${siteUrl}`,
    profile?.email ? `- Email: ${profile.email}` : null,
    profile?.githubUrl ? `- GitHub: ${profile.githubUrl}` : null,
    profile?.linkedinUrl ? `- LinkedIn: ${profile.linkedinUrl}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  const content = `# ${name}

> Personal portfolio of ${name}, ${role}.

## Key Sections

- [Home](${siteUrl}): Portfolio overview with professional experience and skills
- [Projects](${new URL("/projects", siteUrl).href}): Selected work and case studies
- [Blog](${new URL("/blogs", siteUrl).href}): Technical writing on software engineering and web development
- [Ask Zomer AI](${new URL("/ask", siteUrl).href}): AI assistant for questions about Zomer's work, experience, projects, and writing
- [GitHub Contributions](${new URL("/github-contributions", siteUrl).href}): GitHub contribution activity and commit history across owned repositories
- [Contact](${new URL("/contact", siteUrl).href}): Ways to get in touch

## Full Content Index

For a complete list of all blog posts with descriptions, see: ${new URL("/llms-full.txt", siteUrl).href}

## Experience

${experienceLines || "No experience entries published yet."}

## Projects

${projectLines || "No projects published yet."}

## 10 Recent Blog Posts

${recentPostLines || "No blog posts published yet."}

## Contact

${contactLines}
`;

  return new Response(content, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
