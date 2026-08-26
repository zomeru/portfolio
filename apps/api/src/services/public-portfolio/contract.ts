export const PUBLIC_API_VERSION = "1.0.0";
export const PORTFOLIO_MCP_SERVER_NAME = "zomer-gregorio-portfolio";
export const DOCS_MCP_SERVER_NAME = "zomer-gregorio-developer-docs";

export const READ_ONLY_TOOL_ANNOTATIONS = {
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
  readOnlyHint: true,
} as const;

export const PORTFOLIO_MCP_TOOLS = [
  {
    description: "Get Zomer Gregorio's canonical professional profile and public links.",
    name: "get_profile",
    title: "Get Zomer Gregorio Profile",
  },
  {
    description:
      "Get Zomer Gregorio's structured resume, professional experience, technology stack, and current PDF URL.",
    name: "get_resume",
    title: "Get Zomer Gregorio Resume",
  },
  {
    description: "Get the technology groups and tools currently published on Zomer's portfolio.",
    name: "get_tech_stack",
    title: "Get Zomer Gregorio Tech Stack",
  },
  {
    description: "List Zomer Gregorio's published professional experience in display order.",
    name: "list_experience",
    title: "List Professional Experience",
  },
  {
    description: "List the projects currently published on Zomer Gregorio's portfolio.",
    name: "list_projects",
    title: "List Portfolio Projects",
  },
  {
    description:
      "List Zomer Gregorio's published technical articles with bounded pagination, canonical URLs, and optional case-insensitive title search.",
    name: "list_blog_posts",
    title: "List Published Blog Posts",
  },
  {
    description: "Get one published blog post by its canonical public slug.",
    name: "get_blog_post",
    title: "Get Published Blog Post",
  },
] as const;

export const DOCS_MCP_TOOLS = [
  {
    description: "Get API endpoints, protocol scope, quickstart, and versioning guidance.",
    name: "get_api_overview",
    title: "Get API Overview",
  },
  {
    description: "Get the anonymous-access policy and safe credential-handling guidance.",
    name: "get_authentication_guide",
    title: "Get Authentication Guide",
  },
  {
    description: "Get the canonical OpenAPI 3.2 contract as JSON.",
    name: "get_openapi_spec",
    title: "Get OpenAPI Specification",
  },
] as const;

export const PUBLIC_PORTFOLIO_REST_PATHS = [
  "/api/v1",
  "/api/v1/profile",
  "/api/v1/resume",
  "/api/v1/experience",
  "/api/v1/projects",
  "/api/v1/blogs",
  "/api/v1/blogs/{slug}",
  "/api/v1/tech-stack",
] as const;

export const PUBLIC_NOTIFICATION_REST_PATHS = [
  "/api/notifications/email/subscribe",
  "/api/notifications/email/confirm",
  "/api/notifications/email/unsubscribe",
  "/api/notifications/push/config",
  "/api/notifications/push/subscribe",
  "/api/notifications/push/unsubscribe",
] as const;

export const PUBLIC_OPENAPI_PATHS = [
  ...PUBLIC_PORTFOLIO_REST_PATHS,
  ...PUBLIC_NOTIFICATION_REST_PATHS,
] as const;
