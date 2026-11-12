import { createFileRoute } from "@tanstack/react-router";

async function handler({ request }: { request: Request }) {
  const { fetchHono } = await import("@/lib/hono.server");
  return fetchHono(request);
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: handler,
      HEAD: handler,
      POST: handler,
      PUT: handler,
      PATCH: handler,
      DELETE: handler,
      OPTIONS: handler,
    },
  },
});
