import {
  DOCS_MCP_SERVER_NAME,
  DOCS_MCP_TOOLS,
  PORTFOLIO_MCP_SERVER_NAME,
  PORTFOLIO_MCP_TOOLS,
  PUBLIC_API_VERSION,
} from "./contract";
import { publicApiIndexSchema } from "./schemas";

const absoluteUrl = (path: string, siteUrl: URL) => new URL(path, siteUrl).href;

export function getPublicApiIndex(siteUrl: URL) {
  return publicApiIndexSchema.parse({
    authentication: "none",
    capabilities: [
      "profile",
      "structured-resume",
      "professional-experience",
      "projects",
      "blog-posts",
      "technology-stack",
    ],
    discovery: {
      agentSkills: absoluteUrl("/.well-known/agent-skills/index.json", siteUrl),
      apiCatalog: absoluteUrl("/.well-known/api-catalog", siteUrl),
      docsMcpServerCard: absoluteUrl("/.well-known/mcp/docs-server-card.json", siteUrl),
      llms: absoluteUrl("/llms.txt", siteUrl),
      mcpServerCard: absoluteUrl("/.well-known/mcp/server-card.json", siteUrl),
    },
    documentation: absoluteUrl("/developers", siteUrl),
    mcp: {
      documentation: absoluteUrl("/api/mcp/docs", siteUrl),
      portfolio: absoluteUrl("/api/mcp", siteUrl),
    },
    name: "Zomer Gregorio Portfolio API",
    openapi: absoluteUrl("/openapi.json", siteUrl),
    resources: {
      blogs: absoluteUrl("/api/v1/blogs", siteUrl),
      experience: absoluteUrl("/api/v1/experience", siteUrl),
      profile: absoluteUrl("/api/v1/profile", siteUrl),
      projects: absoluteUrl("/api/v1/projects", siteUrl),
      resume: absoluteUrl("/api/v1/resume", siteUrl),
      techStack: absoluteUrl("/api/v1/tech-stack", siteUrl),
    },
    version: PUBLIC_API_VERSION,
  });
}

export function getPortfolioMcpServerCard(siteUrl: URL) {
  return {
    authentication: { required: false },
    description:
      "Public read-only tools for Zomer Gregorio's published profile, resume, experience, projects, technology stack, and technical writing.",
    documentationUrl: absoluteUrl("/developers", siteUrl),
    name: "Zomer Gregorio Portfolio MCP",
    readOnly: true,
    serverName: PORTFOLIO_MCP_SERVER_NAME,
    serverUrl: absoluteUrl("/api/mcp", siteUrl),
    tools: PORTFOLIO_MCP_TOOLS.map(({ description, name }) => ({
      description,
      name,
      readOnly: true,
    })),
    transport: "streamable-http",
    version: PUBLIC_API_VERSION,
  };
}

export function getDocsMcpServerCard(siteUrl: URL) {
  return {
    authentication: { required: false },
    description:
      "Public read-only access to the portfolio API guide, authentication policy, and canonical OpenAPI contract.",
    documentationUrl: absoluteUrl("/developers", siteUrl),
    name: "Zomer Gregorio Developer Documentation MCP",
    readOnly: true,
    serverName: DOCS_MCP_SERVER_NAME,
    serverUrl: absoluteUrl("/api/mcp/docs", siteUrl),
    tools: DOCS_MCP_TOOLS.map(({ description, name }) => ({
      description,
      name,
      readOnly: true,
    })),
    transport: "streamable-http",
    version: PUBLIC_API_VERSION,
  };
}

export function getAgentSkillsIndex(siteUrl: URL) {
  const skill = (name: string, description: string, path: string) => ({
    description,
    endpoint: absoluteUrl(path, siteUrl),
    name,
  });

  return {
    description:
      "Machine-readable capabilities for retrieving Zomer Gregorio's verified public professional information.",
    name: "Zomer Gregorio Portfolio Capabilities",
    skills: [
      skill(
        "Retrieve professional profile",
        "Get Zomer's canonical role, biography, contact links, and resume URL.",
        "/api/v1/profile",
      ),
      skill(
        "Retrieve structured resume",
        "Get Zomer's public experience and technology stack with the canonical resume PDF URL.",
        "/api/v1/resume",
      ),
      skill(
        "Retrieve professional experience",
        "List published roles, companies, dates, responsibilities, and technologies.",
        "/api/v1/experience",
      ),
      skill(
        "Retrieve technology stack",
        "List normalized technology groups currently displayed on the portfolio.",
        "/api/v1/tech-stack",
      ),
      skill(
        "Explore portfolio projects",
        "List every project currently published on the portfolio with public links.",
        "/api/v1/projects",
      ),
      skill(
        "Read technical articles",
        "List published articles or retrieve a specific article through its canonical slug.",
        "/api/v1/blogs",
      ),
      skill(
        "Call portfolio MCP tools",
        "Use deterministic Streamable HTTP MCP tools for the same public portfolio data.",
        "/api/mcp",
      ),
      skill(
        "Read developer documentation",
        "Read the developer portal for REST, MCP, authentication, and versioning guidance.",
        "/developers",
      ),
      skill(
        "Call documentation MCP tools",
        "Use the documentation MCP server for the API guide, authentication policy, and OpenAPI contract.",
        "/api/mcp/docs",
      ),
    ],
    version: PUBLIC_API_VERSION,
  };
}

export function getApiCatalog(siteUrl: URL) {
  const baseUrl = siteUrl.href.replace(/\/$/, "");
  const href = (path: string) => `${baseUrl}${path}`;

  return {
    linkset: [
      {
        anchor: href("/.well-known/api-catalog"),
        item: [
          { href: href("/api/v1") },
          { href: href("/api/mcp") },
          { href: href("/api/mcp/docs") },
        ],
      },
      {
        anchor: href("/api/v1"),
        "service-desc": [{ href: href("/openapi.json"), type: "application/vnd.oai.openapi+json" }],
        "service-doc": [
          { href: href("/developers"), type: "text/html" },
          { href: href("/developers.md"), type: "text/markdown" },
          { href: href("/auth.md"), type: "text/markdown" },
        ],
        "service-meta": [
          { href: href("/api/v1"), type: "application/json" },
          { href: href("/.well-known/agent-skills/index.json"), type: "application/json" },
          { href: href("/.well-known/mcp/server-card.json"), type: "application/json" },
          {
            href: href("/.well-known/mcp/docs-server-card.json"),
            type: "application/json",
          },
        ],
      },
      {
        anchor: href("/api/mcp"),
        "service-desc": [
          { href: href("/.well-known/mcp/server-card.json"), type: "application/json" },
        ],
        "service-doc": [{ href: href("/developers"), type: "text/html" }],
      },
      {
        anchor: href("/api/mcp/docs"),
        "service-desc": [
          {
            href: href("/.well-known/mcp/docs-server-card.json"),
            type: "application/json",
          },
        ],
        "service-doc": [{ href: href("/developers.md"), type: "text/markdown" }],
      },
    ],
  };
}

export function getApiCatalogLinkHeader(siteUrl: URL) {
  return ["/api/v1", "/api/mcp", "/api/mcp/docs", "/openapi.json"]
    .map((path) => `<${absoluteUrl(path, siteUrl)}>; rel="item"`)
    .join(", ");
}
