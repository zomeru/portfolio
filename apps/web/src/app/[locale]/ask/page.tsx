import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AskZomerChat } from "@/components/ai/ask-zomer-chat-client";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/portfolio/page-header";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Metadata.assistant" });
  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/ask",
  });
}

export default async function AskPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const locale = await resolveLocale(params);
  const query = (await searchParams).q;
  const initialQuestion = (Array.isArray(query) ? query[0] : query)?.trim().slice(0, 4_000);
  const t = await getTranslations({ locale, namespace: "Assistant" });
  return (
    <PageTransition>
      <PageHeader index="05" eyebrow={t("eyebrow")} title={t("title")} />
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{t("description")}</p>
      <AskZomerChat initialQuestion={initialQuestion} />
    </PageTransition>
  );
}
