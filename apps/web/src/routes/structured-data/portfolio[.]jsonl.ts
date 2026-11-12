import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/structured-data/portfolio.jsonl")({
  server: {
    handlers: {
      GET: async () => (await import("@/server/structured-data-portfolio-jsonl")).GET(),
    },
  },
});
