import {
  DOCS_MCP_SERVER_NAME,
  DOCS_MCP_TOOLS,
  getOpenApiDocument,
  PUBLIC_API_VERSION,
  READ_ONLY_TOOL_ANNOTATIONS,
} from "@portfolio/api/public-portfolio";
import { getSiteEnv } from "@portfolio/env/site";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

import { getAuthenticationGuideMarkdown, getDeveloperGuideMarkdown } from "@/lib/developer-docs";

const emptyInputSchema = z.object({}).strict();
const markdownOutputSchema = z.object({ markdown: z.string() });
const openApiOutputSchema = z.object({ document: z.record(z.string(), z.unknown()) });

function metadata(name: (typeof DOCS_MCP_TOOLS)[number]["name"]) {
  const tool = DOCS_MCP_TOOLS.find((candidate) => candidate.name === name);
  if (!tool) throw new Error(`Unknown documentation MCP tool: ${name}`);
  return tool;
}

function success(value: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}

export function createDocsMcpHandler(siteUrl = new URL(getSiteEnv().siteUrl)) {
  return createMcpHandler(
    (server) => {
      const overview = metadata("get_api_overview");
      server.registerTool(
        overview.name,
        {
          annotations: READ_ONLY_TOOL_ANNOTATIONS,
          description: overview.description,
          inputSchema: emptyInputSchema,
          outputSchema: markdownOutputSchema,
          title: overview.title,
        },
        async () => success({ markdown: getDeveloperGuideMarkdown(siteUrl) }),
      );

      const auth = metadata("get_authentication_guide");
      server.registerTool(
        auth.name,
        {
          annotations: READ_ONLY_TOOL_ANNOTATIONS,
          description: auth.description,
          inputSchema: emptyInputSchema,
          outputSchema: markdownOutputSchema,
          title: auth.title,
        },
        async () => success({ markdown: getAuthenticationGuideMarkdown(siteUrl) }),
      );

      const openApi = metadata("get_openapi_spec");
      server.registerTool(
        openApi.name,
        {
          annotations: READ_ONLY_TOOL_ANNOTATIONS,
          description: openApi.description,
          inputSchema: emptyInputSchema,
          outputSchema: openApiOutputSchema,
          title: openApi.title,
        },
        async () => success({ document: getOpenApiDocument(siteUrl) }),
      );
    },
    {
      instructions:
        "Use this server to discover and understand the public portfolio REST and MCP contracts. It never requires credentials.",
      serverInfo: { name: DOCS_MCP_SERVER_NAME, version: PUBLIC_API_VERSION },
    },
  );
}
