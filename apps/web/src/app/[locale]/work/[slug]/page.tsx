import { getPublicExperience, getPublicPortfolioSnapshot } from "@portfolio/api/public-portfolio";
import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PageTransition } from "@/components/layout/page-transition";
import { DetailSections } from "@/components/portfolio/detail-sections";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/server";
import { createPageMetadata } from "@/lib/metadata";
import { experienceTranslationKeys } from "@/lib/portfolio-content";

type WorkPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

const getExperience = cache((slug: string) => getPublicExperience(slug));

export async function generateStaticParams() {
  return (await getPublicPortfolioSnapshot()).experience.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: WorkPageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const [experience, t] = await Promise.all([
    getExperience(slug),
    getTranslations({ locale, namespace: "Experience" }),
  ]);
  if (!experience) return {};

  const entryKey =
    experienceTranslationKeys[experience.company as keyof typeof experienceTranslationKeys];
  const role = locale !== "en" && entryKey ? t(`entries.${entryKey}.role`) : experience.role;

  return createPageMetadata({
    title: `${role} — ${experience.company}`,
    description:
      experience.summary ??
      t("detail.metadataDescription", {
        company: experience.company,
        role,
        summary: experience.responsibilities[0] ?? "",
      }),
    locale,
    path: `/work/${experience.slug}`,
  });
}

export default async function WorkDetailPage({ params }: WorkPageProps) {
  const locale = await resolveLocale(params);
  const [{ slug }, t] = await Promise.all([
    params,
    getTranslations({ locale, namespace: "Experience" }),
  ]);
  const experience = await getExperience(slug);
  if (!experience) notFound();

  const entryKey =
    experienceTranslationKeys[experience.company as keyof typeof experienceTranslationKeys];
  const role = locale !== "en" && entryKey ? t(`entries.${entryKey}.role`) : experience.role;
  const period = locale !== "en" && entryKey ? t(`entries.${entryKey}.period`) : experience.period;

  return (
    <PageTransition>
      <article>
        <Link
          href="/"
          className="font-mono text-xs text-muted underline-offset-4 transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
        >
          ← {t("detail.back")}
        </Link>

        <p className="mt-8 font-mono text-xs uppercase tracking-widest text-muted">
          {t("detail.eyebrow")}
        </p>
        <h1 className="mt-3 text-balance text-2xl font-medium leading-snug tracking-tight sm:text-3xl">
          {role}
        </h1>
        {experience.companyUrl ? (
          <a
            href={experience.companyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-base text-muted underline-offset-4 transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
          >
            {experience.company}
            <span className="sr-only"> {t("detail.opensNewTab")}</span>
            <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.5} />
          </a>
        ) : (
          <p className="mt-2 text-base text-muted">{experience.company}</p>
        )}

        <dl className="mt-8 grid gap-5 border-y border-border py-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-widest text-muted">
              {t("detail.period")}
            </dt>
            <dd className="mt-1">{period}</dd>
          </div>
          {experience.location ? (
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-widest text-muted">
                {t("detail.location")}
              </dt>
              <dd className="mt-1">{experience.location}</dd>
            </div>
          ) : null}
        </dl>

        {experience.summary ? (
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted">{experience.summary}</p>
        ) : null}

        {experience.technologies.length > 0 ? (
          <section aria-labelledby="work-technologies" className="mt-12">
            <h2 id="work-technologies" className="text-lg font-medium tracking-tight">
              {t("detail.technologies")}
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {experience.technologies.map((technology) => (
                <li
                  key={technology}
                  className="rounded-full border border-border px-3 py-1.5 font-mono text-xs text-muted"
                >
                  {technology}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {experience.details.length > 0 ? (
          <DetailSections sections={experience.details} />
        ) : experience.responsibilities.length > 0 ? (
          <section className="mt-14">
            <h2 className="text-lg font-medium tracking-tight">{t("detail.responsibilities")}</h2>
            <ul className="mt-3 max-w-2xl list-disc space-y-2 ps-5 text-sm leading-relaxed text-muted">
              {experience.responsibilities.map((responsibility) => (
                <li key={responsibility} className="ps-1">
                  {responsibility}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </PageTransition>
  );
}
