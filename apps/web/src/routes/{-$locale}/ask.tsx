import { createFileRoute } from "@tanstack/react-router";
import { useTranslations } from "use-intl";

import { AskZomerChat } from "@/components/ai/ask-zomer-chat-client";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/portfolio/page-header";
import { translatedHead } from "@/lib/localized-head";

export const Route = createFileRoute("/{-$locale}/ask")({
  validateSearch: ({ q }: Record<string, unknown>) => ({
    q: typeof q === "string" ? q.trim().slice(0, 4_000) : undefined,
  }),
  head: (input) =>
    translatedHead(input, "assistant", "/ask", { imagePath: "/ask/opengraph-image" }),
  component: AskPage,
});

function AskPage() {
  const t = useTranslations("Assistant");
  const { q: initialQuestion } = Route.useSearch();
  return (
    <PageTransition>
      <PageHeader index="05" eyebrow={t("eyebrow")} title={t("title")} />
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{t("description")}</p>
      <AskZomerChat initialQuestion={initialQuestion} />
    </PageTransition>
  );
}
