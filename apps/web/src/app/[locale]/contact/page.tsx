import { getPublicProfile } from "@portfolio/api/public-portfolio";
import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageTransition } from "@/components/layout/page-transition";
import { BookACallButton } from "@/components/portfolio/book-a-call-button";
import { PageHeader } from "@/components/portfolio/page-header";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { createPageMetadata } from "@/lib/metadata";
import { getProfileSocials } from "@/lib/sanity/profile";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Metadata.contact" });
  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/contact",
  });
}

export default async function ContactPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const [profile, t, tCommon] = await Promise.all([
    getPublicProfile(),
    getTranslations({ locale, namespace: "Contact" }),
    getTranslations({ locale, namespace: "Common" }),
  ]);
  const elsewhere = (profile ? getProfileSocials(profile) : []).filter((p) => p.name !== "GitHub");

  return (
    <PageTransition>
      <PageHeader index="06" eyebrow={t("eyebrow")} title={t("title")} />

      <BookACallButton />

      <h2 className="mt-16 font-mono text-xs uppercase tracking-widest text-muted">
        {t("elsewhere")}
      </h2>
      <ul className="mt-2 divide-y divide-border border-t border-border">
        {elsewhere.map((social) => (
          <li key={social.name}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 py-4 text-sm underline-offset-4 transition-colors duration-200 hover:text-muted motion-reduce:transition-none"
            >
              {social.name === "Email" ? tCommon("social.email") : social.name}{" "}
              <ArrowUpRight aria-hidden="true" size={14} />
            </a>
          </li>
        ))}
      </ul>
    </PageTransition>
  );
}
