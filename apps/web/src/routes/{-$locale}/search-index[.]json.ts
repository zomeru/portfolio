import { createFileRoute } from "@tanstack/react-router";

import { defaultLocale, isLocale } from "@/i18n/routing";

export const Route = createFileRoute("/{-$locale}/search-index.json")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const locale = params.locale ?? defaultLocale;
        if (!isLocale(locale))
          return Response.json({ error: "Unsupported locale." }, { status: 404 });
        const { getSearchIndex } = await import("@/features/search/lib/get-index");
        return Response.json(await getSearchIndex(locale), {
          headers: { "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
