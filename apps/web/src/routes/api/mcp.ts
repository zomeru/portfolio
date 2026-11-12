import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mcp")({
  server: {
    handlers: {
      GET: async ({ request }) => (await import("@/server/api-mcp")).GET(request),
      POST: async ({ request }) => (await import("@/server/api-mcp")).POST(request),
      DELETE: async ({ request }) => (await import("@/server/api-mcp")).DELETE(request),
    },
  },
});
