import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/.well-known/mcp/docs-server-card.json")({
  server: {
    handlers: {
      GET: async () => (await import("@/server/well-known-mcp-docs-server-card-json")).GET(),
    },
  },
});
