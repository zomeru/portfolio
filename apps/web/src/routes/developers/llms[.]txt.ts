import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/developers/llms.txt")({
  server: {
    handlers: {
      GET: async () => (await import("@/server/developers-llms-txt")).GET(),
    },
  },
});
