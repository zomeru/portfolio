import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/")({
  server: {
    handlers: {
      GET: async ({ request }) => (await import("@/lib/hono.server")).fetchHono(request),
    },
  },
});
