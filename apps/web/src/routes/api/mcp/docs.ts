import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mcp/docs")({
  server: {
    handlers: {
      GET: async ({ request }) => (await import("@/server/api-mcp-docs")).GET(request),
      POST: async ({ request }) => (await import("@/server/api-mcp-docs")).POST(request),
      DELETE: async ({ request }) => (await import("@/server/api-mcp-docs")).DELETE(request),
    },
  },
});
