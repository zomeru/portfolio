import { createFileRoute } from "@tanstack/react-router";

import { defaultLocale, isLocale } from "@/i18n/routing";

export const Route = createFileRoute("/{-$locale}/projects/opengraph-image")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const locale = params.locale ?? defaultLocale;
        if (!isLocale(locale)) return new Response(null, { status: 404 });
        return (await import("@/server/og-projects")).image(locale);
      },
    },
  },
});
