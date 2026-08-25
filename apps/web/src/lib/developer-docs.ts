import {
  DOCS_MCP_TOOLS,
  PORTFOLIO_MCP_TOOLS,
  PUBLIC_API_VERSION,
} from "@portfolio/api/public-portfolio";

const absoluteUrl = (path: string, siteUrl: URL) => new URL(path, siteUrl).href;

export function getAuthenticationGuideMarkdown(siteUrl: URL) {
  return `# Authentication policy

The Zomer Gregorio Portfolio API is public, anonymous, read-only, and limited to information already published on the portfolio.

- Authentication: none
- Credentials: clients SHOULD NOT send API keys, cookies, bearer tokens, or other credentials
- Mutations: none
- Canonical API index: ${absoluteUrl("/api/v1", siteUrl)}

Private administration, draft content, AI indexing metadata, embeddings, provider configuration, and secrets are outside this public contract.
`;
}

export function getDeveloperGuideMarkdown(siteUrl: URL) {
  const origin = siteUrl.href.replace(/\/$/, "");
  const tools = PORTFOLIO_MCP_TOOLS.map((tool) => `- \`${tool.name}\` — ${tool.description}`).join(
    "\n",
  );
  const docsTools = DOCS_MCP_TOOLS.map((tool) => `- \`${tool.name}\` — ${tool.description}`).join(
    "\n",
  );
  const inspectorCommands = [
    `npx @modelcontextprotocol/inspector --server-url ${origin}/api/mcp --transport http`,
    `npx @modelcontextprotocol/inspector --cli --server-url ${origin}/api/mcp --transport http --method tools/list`,
  ].join("\n");

  return `# Zomer Gregorio Portfolio API

The Portfolio API gives agents and developers deterministic, structured access to Zomer Gregorio's published professional information without scraping HTML.

## Endpoints

| Service | URL |
| --- | --- |
| REST API index | [\`${origin}/api/v1\`](${origin}/api/v1) |
| OpenAPI 3.2 | [\`${origin}/openapi.json\`](${origin}/openapi.json) |
| Portfolio MCP | [\`${origin}/api/mcp\`](${origin}/api/mcp) |
| Documentation MCP | [\`${origin}/api/mcp/docs\`](${origin}/api/mcp/docs) |
| API catalog | [\`${origin}/.well-known/api-catalog\`](${origin}/.well-known/api-catalog) |
| Portfolio MCP server card | [\`${origin}/.well-known/mcp/server-card.json\`](${origin}/.well-known/mcp/server-card.json) |
| Documentation MCP server card | [\`${origin}/.well-known/mcp/docs-server-card.json\`](${origin}/.well-known/mcp/docs-server-card.json) |
| Agent capabilities | [\`${origin}/.well-known/agent-skills/index.json\`](${origin}/.well-known/agent-skills/index.json) |

The REST contract is version ${PUBLIC_API_VERSION}. Breaking REST changes will use a new URL version such as \`/api/v2\`; non-breaking additions may remain in \`/api/v1\`.

## REST resources

| Resource | Method | Endpoint |
| --- | --- | --- |
| API index | GET | \`/api/v1\` |
| Profile | GET | \`/api/v1/profile\` |
| Resume | GET | \`/api/v1/resume\` |
| Experience | GET | \`/api/v1/experience\` |
| Projects | GET | \`/api/v1/projects\` |
| Blogs | GET | \`/api/v1/blogs?limit=10&offset=0\` |
| Blog | GET | \`/api/v1/blogs/{slug}\` |
| Tech stack | GET | \`/api/v1/tech-stack\` |

All REST resources support anonymous cross-origin reads and return cacheable JSON sourced from published Sanity content.

## REST examples

\`\`\`bash
curl ${origin}/api/v1
curl ${origin}/api/v1/profile
curl '${origin}/api/v1/blogs?limit=5&offset=0'
curl ${origin}/api/v1/resume
\`\`\`

## MCP

Connect a Streamable HTTP MCP client to:

\`\`\`text
${origin}/api/mcp
\`\`\`

Available portfolio tools:

${tools}

The documentation MCP at ${origin}/api/mcp/docs exposes:

${docsTools}

Example client configuration:

\`\`\`json
{
  "mcpServers": {
    "zomer-portfolio": {
      "url": "${origin}/api/mcp"
    },
    "zomer-portfolio-docs": {
      "url": "${origin}/api/mcp/docs"
    }
  }
}
\`\`\`

The Inspector commands below target the portfolio MCP. Replace \`${origin}/api/mcp\` with \`${origin}/api/mcp/docs\` to inspect the documentation MCP.

## Current MCP Inspector commands

\`\`\`bash
${inspectorCommands}
\`\`\`

## Authentication and safety

Authentication is \`none\`. Clients SHOULD NOT send credentials. Every operation is read-only and exposes only explicit public DTOs; draft documents, Sanity internals, embeddings, admin metadata, and secrets are excluded.

## Caching and freshness

Responses use public HTTP caching and the existing five-minute Sanity revalidation window. Newly published content should appear reasonably quickly without creating a second cache architecture.
`;
}

export function getDeveloperLlmsText(siteUrl: URL) {
  const origin = siteUrl.href.replace(/\/$/, "");
  return `# Zomer Gregorio Portfolio Developer Resources

> Public, anonymous, read-only machine interfaces for verified portfolio data.

- API index: ${origin}/api/v1
- OpenAPI 3.2: ${origin}/openapi.json
- MCP Streamable HTTP: ${origin}/api/mcp
- Documentation MCP: ${origin}/api/mcp/docs
- Developer guide: ${origin}/developers.md
- Authentication policy: ${origin}/auth.md
- RFC 9727 API catalog: ${origin}/.well-known/api-catalog
- Portfolio MCP server card: ${origin}/.well-known/mcp/server-card.json
- Documentation MCP server card: ${origin}/.well-known/mcp/docs-server-card.json
- Agent skills: ${origin}/.well-known/agent-skills/index.json
`;
}
