import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useTranslations } from "use-intl";
import { createTranslator } from "use-intl/core";

import { PageTransition } from "@/components/layout/page-transition";
import { ExperienceItem } from "@/components/portfolio/experience-item";
import { PageHeader } from "@/components/portfolio/page-header";
import { experienceTranslationKeys } from "@/lib/portfolio-content";
import { getHome } from "@/lib/public.functions";
import { getSiteMatch, pageHead } from "@/lib/route-head";

const publicLayout = getRouteApi("/{-$locale}");

export const Route = createFileRoute("/{-$locale}/")({
  loader: () => getHome(),
  head: ({ match: { context }, matches }) => {
    if (!context.messages) return {};
    const site = getSiteMatch(matches);
    const { locale, messages } = context;
    const t = createTranslator({ locale, messages, namespace: "Metadata.root" });
    const name = site?.profile?.name || "Portfolio";
    const role = locale === "en" && site?.profile?.role ? site.profile.role : t("role");
    const description =
      locale === "en" && site?.profile?.biography ? site.profile.biography : t("description");
    if (!site) return {};
    const head = pageHead({
      locale,
      title: `${name} - ${role}`,
      description,
      path: "/",
      siteName: name,
      siteUrl: site.siteUrl,
    });
    return {
      ...head,
      meta: [
        ...head.meta,
        { name: "author", content: name },
        { name: "application-name", content: name },
      ],
    };
  },
  component: AboutPage,
});

function AboutPage() {
  const { locale } = Route.useRouteContext();
  const { profile } = publicLayout.useLoaderData();
  const experience = Route.useLoaderData();
  const tHome = useTranslations("Home");
  const tExperience = useTranslations("Experience");
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
        <ol className="relative mt-3 before:pointer-events-none before:absolute before:bottom-2 before:left-1 before:top-2 before:w-0.5 before:bg-linear-to-b before:from-border before:via-border before:to-transparent">
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
