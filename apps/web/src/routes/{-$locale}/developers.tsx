import { createFileRoute } from "@tanstack/react-router";
import { useTranslations } from "use-intl";

import { PageTransition } from "@/components/layout/page-transition";
import { MarkdownContent } from "@/components/portfolio/markdown-content";
import { PageHeader } from "@/components/portfolio/page-header";
import { translatedHead } from "@/lib/localized-head";
import { getDevelopers } from "@/lib/public.functions";

export const Route = createFileRoute("/{-$locale}/developers")({
  loader: ({ context }) => getDevelopers({ data: context.locale }),
  head: (input) => translatedHead(input, "developers", "/developers"),
  component: DevelopersPage,
});

function DevelopersPage() {
  const { locale } = Route.useRouteContext();
  const t = useTranslations("Developers");
  const html = Route.useLoaderData();
  return (
    <PageTransition>
      <PageHeader index="07" eyebrow={t("heading")} title={t("description")} />
      {locale !== "en" && (
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{t("referenceLanguage")}</p>
      )}
      <article className="mt-10" lang="en" translate="no">
        <MarkdownContent html={html} />
      </article>
    </PageTransition>
  );
}
