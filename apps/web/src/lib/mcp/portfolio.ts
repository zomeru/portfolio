import {
  getPublicPortfolioService,
  PORTFOLIO_MCP_SERVER_NAME,
  PORTFOLIO_MCP_TOOLS,
  PUBLIC_API_VERSION,
  type PublicPortfolioService,
  publicBlogPostListSchema,
  publicBlogPostSchema,
  publicExperienceListSchema,
  publicProfileSchema,
  publicProjectListSchema,
  publicResumeSchema,
  publicTechStackSchema,
  READ_ONLY_TOOL_ANNOTATIONS,
} from "@portfolio/api/public-portfolio";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const emptyInputSchema = z.object({}).strict();
const blogListInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(10),
    offset: z.number().int().min(0).default(0),
    query: z
      .string()
      .trim()
      .max(200)
      .default("")
      .describe("Case-insensitive title substring. An empty query returns all posts."),
  })
  .strict();
const blogPostInputSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  })
  .strict();

function metadata(name: (typeof PORTFOLIO_MCP_TOOLS)[number]["name"]) {
  const tool = PORTFOLIO_MCP_TOOLS.find((candidate) => candidate.name === name);
  if (!tool) throw new Error(`Unknown portfolio MCP tool: ${name}`);
  return tool;
}

function success(value: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}

function notFound(resource: string) {
  return {
    content: [
      {
        type: "text" as const,
        text: `No published ${resource} is currently available. Use a list tool to discover canonical resources.`,
      },
    ],
    isError: true,
  };
}

export function createPortfolioMcpHandler(
  service: PublicPortfolioService = getPublicPortfolioService(),
) {
  return createMcpHandler(
    (server) => {
      const profile = metadata("get_profile");
      server.registerTool(
        profile.name,
        {
          annotations: READ_ONLY_TOOL_ANNOTATIONS,
          description: profile.description,
          inputSchema: emptyInputSchema,
          outputSchema: publicProfileSchema,
          title: profile.title,
        },
        async () => {
          const value = await service.getProfile();
          return value ? success(value) : notFound("profile");
        },
      );

      const resume = metadata("get_resume");
      server.registerTool(
        resume.name,
        {
          annotations: READ_ONLY_TOOL_ANNOTATIONS,
          description: resume.description,
          inputSchema: emptyInputSchema,
          outputSchema: publicResumeSchema,
          title: resume.title,
        },
        async () => {
          const value = await service.getResume();
          return value ? success(value) : notFound("resume");
        },
      );

      const techStack = metadata("get_tech_stack");
      server.registerTool(
        techStack.name,
        {
          annotations: READ_ONLY_TOOL_ANNOTATIONS,
          description: techStack.description,
          inputSchema: emptyInputSchema,
          outputSchema: publicTechStackSchema,
          title: techStack.title,
        },
        async () => success(await service.listTechStack()),
      );

      const experience = metadata("list_experience");
      server.registerTool(
        experience.name,
        {
          annotations: READ_ONLY_TOOL_ANNOTATIONS,
          description: experience.description,
          inputSchema: emptyInputSchema,
          outputSchema: publicExperienceListSchema,
          title: experience.title,
        },
        async () => success(await service.listExperience()),
      );

      const projects = metadata("list_projects");
      server.registerTool(
        projects.name,
        {
          annotations: READ_ONLY_TOOL_ANNOTATIONS,
          description: projects.description,
          inputSchema: emptyInputSchema,
          outputSchema: publicProjectListSchema,
          title: projects.title,
        },
        async () => success(await service.listProjects()),
      );

      const blogList = metadata("list_blog_posts");
      server.registerTool(
        blogList.name,
        {
          annotations: READ_ONLY_TOOL_ANNOTATIONS,
          description: blogList.description,
          inputSchema: blogListInputSchema,
          outputSchema: publicBlogPostListSchema,
          title: blogList.title,
        },
        async (input) => success(await service.listBlogPosts(input)),
      );

      const blogPost = metadata("get_blog_post");
      server.registerTool(
        blogPost.name,
        {
          annotations: READ_ONLY_TOOL_ANNOTATIONS,
          description: blogPost.description,
          inputSchema: blogPostInputSchema,
          outputSchema: publicBlogPostSchema,
          title: blogPost.title,
        },
        async ({ slug }) => {
          const value = await service.getBlogPost(slug);
          return value ? success(value) : notFound(`blog post at slug ${slug}`);
        },
      );
    },
    {
      instructions:
        "Use these read-only tools for Zomer Gregorio's canonical published portfolio data. Prefer list_blog_posts before get_blog_post when you do not already have a canonical slug.",
      serverInfo: { name: PORTFOLIO_MCP_SERVER_NAME, version: PUBLIC_API_VERSION },
    },
  );
}
