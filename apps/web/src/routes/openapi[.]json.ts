import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/openapi.json")({
  server: {
    handlers: {
      GET: async () => (await import("@/server/openapi-json")).GET(),
    },
  },
});
