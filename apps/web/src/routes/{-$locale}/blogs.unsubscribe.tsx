import { createFileRoute } from "@tanstack/react-router";
import { useTranslations } from "use-intl";

import { UnsubscribeForm } from "@/components/blog/unsubscribe-form";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/portfolio/page-header";
import { translatedHead } from "@/lib/localized-head";

export const Route = createFileRoute("/{-$locale}/blogs/unsubscribe")({
  validateSearch: ({ token }: Record<string, unknown>) => ({
    token: typeof token === "string" ? token : undefined,
  }),
  head: (input) =>
    translatedHead(input, "unsubscribe", "/blogs/unsubscribe", {
      noindex: true,
      imagePath: "/blogs/opengraph-image",
    }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const t = useTranslations("Blogs.unsubscribe");
  const { token } = Route.useSearch();
  return (
    <PageTransition>
      <PageHeader index="03" eyebrow={t("eyebrow")} title={t("title")} />
      <UnsubscribeForm {...(token ? { token } : {})} />
    </PageTransition>
  );
}
