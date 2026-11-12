import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: async () => (await import("@/server/llms-full-txt")).GET(),
    },
  },
});
