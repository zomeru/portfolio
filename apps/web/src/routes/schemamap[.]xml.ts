import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/schemamap.xml")({
  server: {
    handlers: {
      GET: async () => (await import("@/server/schemamap-xml")).GET(),
    },
  },
});
