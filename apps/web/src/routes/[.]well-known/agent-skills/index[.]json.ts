import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/.well-known/agent-skills/index.json")({
  server: {
    handlers: {
      GET: async () => (await import("@/server/well-known-agent-skills-index-json")).GET(),
    },
  },
});
