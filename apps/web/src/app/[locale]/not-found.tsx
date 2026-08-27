import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageTransition } from "@/components/layout/page-transition";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Errors.notFound");
  return { title: t("eyebrow"), robots: { index: false, follow: false } };
}

export default async function NotFound() {
  const t = await getTranslations("Errors.notFound");
  return (
    <PageTransition>
      <section aria-labelledby="not-found-heading" className="max-w-xl">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">{t("eyebrow")}</p>
        <h1 id="not-found-heading" className="mt-3 text-2xl font-medium tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t("description")}</p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity duration-200 hover:opacity-80 motion-reduce:transition-none"
        >
          {t("action")}
        </Link>
      </section>
    </PageTransition>
  );
}
