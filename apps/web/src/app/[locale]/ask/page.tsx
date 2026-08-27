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

export default async function AskPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Assistant" });
  return (
    <PageTransition>
      <PageHeader index="05" eyebrow={t("eyebrow")} title={t("title")} />
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{t("description")}</p>
      <AskZomerChat />
    </PageTransition>
  );
}
