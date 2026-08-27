import { getPublicProfile, listPublicExperience } from "@portfolio/api/public-portfolio";
import { getTranslations } from "next-intl/server";

import { PageTransition } from "@/components/layout/page-transition";
import { ExperienceItem } from "@/components/portfolio/experience-item";
import { PageHeader } from "@/components/portfolio/page-header";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { experienceTranslationKeys } from "@/lib/portfolio-content";

export default async function AboutPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const [profile, experience, tHome, tExperience] = await Promise.all([
    getPublicProfile(),
    listPublicExperience(),
    getTranslations({ locale, namespace: "Home" }),
    getTranslations({ locale, namespace: "Experience" }),
  ]);

  return (
    <PageTransition>
      <PageHeader
        index="01"
        eyebrow={tHome("eyebrow")}
        title={locale === "en" ? profile?.biography || tHome("unavailable") : tHome("biography")}
      />
      {profile?.about && (
        <p className="mt-3 max-w-xl whitespace-pre-line text-sm leading-relaxed text-muted">
          {locale === "en" ? profile.about : tHome("about")}
        </p>
      )}

      <section aria-labelledby="experience-heading" className="mt-16">
        <h2
          id="experience-heading"
          className="font-mono text-xs uppercase tracking-widest text-muted"
        >
          {tExperience("heading")}
        </h2>
        <ol className="relative mt-3">
          <span
            aria-hidden
            className="absolute bottom-2 left-1 top-2 w-0.5 bg-linear-to-b from-border via-border to-transparent"
          />
          {experience.items.map((job) => {
            const entryKey =
              experienceTranslationKeys[job.company as keyof typeof experienceTranslationKeys];
            const localizedJob =
              locale !== "en" && entryKey
                ? {
                    ...job,
                    period: tExperience(`entries.${entryKey}.period`),
                    role: tExperience(`entries.${entryKey}.role`),
                  }
                : job;

            return (
              <li key={`${job.company}-${job.role}-${job.period}`} className="pb-8 last:pb-0">
                <ExperienceItem job={localizedJob} />
              </li>
            );
          })}
          {experience.total === 0 && (
            <li className="pl-7 text-sm text-muted">{tExperience("empty")}</li>
          )}
        </ol>
      </section>
    </PageTransition>
  );
}
