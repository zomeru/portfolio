import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/revalidate/sanity")({
  server: {
    handlers: {
      POST: async ({ request }) => (await import("@/server/api-revalidate-sanity")).POST(request),
    },
  },
});
