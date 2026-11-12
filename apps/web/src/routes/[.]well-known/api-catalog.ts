import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/.well-known/api-catalog")({
  server: {
    handlers: {
      GET: async () => (await import("@/server/well-known-api-catalog")).GET(),
      HEAD: async () => (await import("@/server/well-known-api-catalog")).HEAD(),
    },
  },
});
