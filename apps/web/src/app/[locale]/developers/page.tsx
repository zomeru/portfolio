import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageTransition } from "@/components/layout/page-transition";
import { MarkdownContent } from "@/components/portfolio/markdown-content";
import { PageHeader } from "@/components/portfolio/page-header";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { getDeveloperGuideMarkdown } from "@/lib/developer-docs";
import { createPageMetadata, siteUrl } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Metadata.developers" });
  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/developers",
  });
}

export default async function DevelopersPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Developers" });
  const canonicalSiteUrl = new URL(siteUrl);

  return (
    <PageTransition>
      <PageHeader index="07" eyebrow={t("heading")} title={t("description")} />
      {locale !== "en" && (
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{t("referenceLanguage")}</p>
      )}
      <article className="mt-10" lang="en" translate="no">
        <MarkdownContent openLinksInNewTab value={getDeveloperGuideMarkdown(canonicalSiteUrl)} />
      </article>
    </PageTransition>
  );
}
