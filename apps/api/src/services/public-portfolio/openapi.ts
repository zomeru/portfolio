import { z } from "zod";
import { PUBLIC_API_VERSION } from "./contract";
import {
  publicApiIndexSchema,
  publicBlogPostListSchema,
  publicBlogPostSchema,
  publicErrorSchema,
  publicExperienceListSchema,
  publicProfileSchema,
  publicProjectListSchema,
  publicResumeSchema,
  publicTechStackSchema,
} from "./schemas";

const schema = (value: z.ZodType) => z.toJSONSchema(value, { target: "draft-2020-12" });
const jsonContent = (schemaName: string) => ({
  "application/json": { schema: { $ref: `#/components/schemas/${schemaName}` } },
});
const success = (description: string, schemaName: string) => ({
  description,
  content: jsonContent(schemaName),
});
const error = (description: string) => ({
  description,
  content: jsonContent("Error"),
});

export function getOpenApiDocument(siteUrl: URL) {
  return {
    openapi: "3.2.0",
    info: {
      contact: { name: "Zomer Gregorio", url: new URL("/contact", siteUrl).href },
      description:
        "Anonymous, read-only access to Zomer Gregorio's published Sanity-backed professional portfolio data.",
      title: "Zomer Gregorio Portfolio API",
      version: PUBLIC_API_VERSION,
    },
    externalDocs: {
      description: "Developer resources",
      url: new URL("/developers", siteUrl).href,
    },
    servers: [{ description: "Canonical production site", url: siteUrl.href.replace(/\/$/, "") }],
    security: [],
    tags: [
      { description: "API metadata and discovery links.", name: "Discovery" },
      { description: "Published professional portfolio data.", name: "Portfolio" },
      { description: "Published technical writing.", name: "Blog" },
    ],
    paths: {
      "/api/v1": {
        get: {
          operationId: "getApiIndex",
          responses: { "200": success("API metadata and canonical resources.", "ApiIndex") },
          security: [],
          summary: "Get the public API index",
          tags: ["Discovery"],
        },
      },
      "/api/v1/profile": {
        get: {
          operationId: "getProfile",
          responses: {
            "200": success("Zomer Gregorio's public profile.", "Profile"),
            "404": error("No published profile is available."),
          },
          security: [],
          summary: "Get the public professional profile",
          tags: ["Portfolio"],
        },
      },
      "/api/v1/resume": {
        get: {
          operationId: "getResume",
          responses: {
            "200": success("Structured resume with the canonical PDF URL.", "Resume"),
            "404": error("No published resume source is available."),
          },
          security: [],
          summary: "Get the structured public resume",
          tags: ["Portfolio"],
        },
      },
      "/api/v1/experience": {
        get: {
          operationId: "listExperience",
          responses: {
            "200": success("Published professional experience.", "ExperienceList"),
          },
          security: [],
          summary: "List professional experience",
          tags: ["Portfolio"],
        },
      },
      "/api/v1/projects": {
        get: {
          operationId: "listProjects",
          responses: { "200": success("Published portfolio projects.", "ProjectList") },
          security: [],
          summary: "List published projects",
          tags: ["Portfolio"],
        },
      },
      "/api/v1/blogs": {
        get: {
          operationId: "listBlogPosts",
          parameters: [
            {
              description: "Maximum posts to return.",
              in: "query",
              name: "limit",
              required: false,
              schema: { default: 10, maximum: 50, minimum: 1, type: "integer" },
            },
            {
              description: "Number of posts to skip.",
              in: "query",
              name: "offset",
              required: false,
              schema: { default: 0, minimum: 0, type: "integer" },
            },
          ],
          responses: {
            "200": success("A bounded page of published blog posts.", "BlogPostList"),
            "400": error("The pagination parameters are invalid."),
          },
          security: [],
          summary: "List published blog posts",
          tags: ["Blog"],
        },
      },
      "/api/v1/blogs/{slug}": {
        get: {
          operationId: "getBlogPost",
          parameters: [
            {
              description: "Canonical Sanity blog slug.",
              in: "path",
              name: "slug",
              required: true,
              schema: {
                maxLength: 200,
                minLength: 1,
                pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                type: "string",
              },
            },
          ],
          responses: {
            "200": success("One published blog post including its Markdown body.", "BlogPost"),
            "400": error("The slug is invalid."),
            "404": error("No published blog post has the requested slug."),
          },
          security: [],
          summary: "Get a published blog post",
          tags: ["Blog"],
        },
      },
      "/api/v1/tech-stack": {
        get: {
          operationId: "getTechStack",
          responses: { "200": success("Published technology groups.", "TechStack") },
          security: [],
          summary: "Get the current technology stack",
          tags: ["Portfolio"],
        },
      },
    },
    components: {
      schemas: {
        ApiIndex: schema(publicApiIndexSchema),
        BlogPost: schema(publicBlogPostSchema),
        BlogPostList: schema(publicBlogPostListSchema),
        Error: schema(publicErrorSchema),
        ExperienceList: schema(publicExperienceListSchema),
        Profile: schema(publicProfileSchema),
        ProjectList: schema(publicProjectListSchema),
        Resume: schema(publicResumeSchema),
        TechStack: schema(publicTechStackSchema),
      },
    },
  } as const;
}
