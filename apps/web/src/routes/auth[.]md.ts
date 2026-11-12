import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth.md")({
  server: {
    handlers: {
      GET: async () => (await import("@/server/auth-md")).GET(),
    },
  },
});
