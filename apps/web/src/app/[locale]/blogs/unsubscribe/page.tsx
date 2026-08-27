import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/portfolio/page-header";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { createPageMetadata } from "@/lib/metadata";

import { UnsubscribeForm } from "./unsubscribe-form";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Metadata.unsubscribe" });
  return {
    ...createPageMetadata({
      title: t("title"),
      description: t("description"),
      locale,
      path: "/blogs/unsubscribe",
    }),
    robots: { index: false, follow: false },
  };
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: Promise<{ token?: string }>;
}) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Blogs.unsubscribe" });
  const { token } = await searchParams;
  return (
    <PageTransition>
      <PageHeader index="03" eyebrow={t("eyebrow")} title={t("title")} />
      <UnsubscribeForm {...(token ? { token } : {})} />
    </PageTransition>
  );
}
