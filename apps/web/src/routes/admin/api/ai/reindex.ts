import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/api/ai/reindex")({
  server: {
    handlers: {
      POST: async ({ request }) => (await import("@/server/admin-api-ai-reindex")).POST(request),
    },
  },
});
