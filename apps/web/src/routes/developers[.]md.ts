import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/developers.md")({
  server: {
    handlers: {
      GET: async () => (await import("@/server/developers-md")).GET(),
    },
  },
});
