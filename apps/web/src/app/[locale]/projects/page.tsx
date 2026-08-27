import { listPublicProjects } from "@portfolio/api/public-portfolio";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/portfolio/page-header";
import { ProjectItem } from "@/components/portfolio/project-item";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { createPageMetadata } from "@/lib/metadata";

const projectDescriptionKeys = {
  "Rezumer AI": "rezumerAi",
  Batibot: "batibot",
  Zomink: "zomink",
  "STICA LMS": "sticaLms",
  Kokuban: "kokuban",
  Zomify: "zomify",
  "Paymongo.js": "paymongo",
  "Groundwork PH": "groundwork",
  "Zomify Colors": "zomifyColors",
} as const;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Metadata.projects" });
  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/projects",
  });
}

export default async function ProjectsPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const [projects, t] = await Promise.all([
    listPublicProjects(),
    getTranslations({ locale, namespace: "Projects" }),
  ]);

  return (
    <PageTransition>
      <PageHeader index="02" eyebrow={t("eyebrow")} title={t("title")} />
      <ul className="mt-10 divide-y divide-border border-t border-border">
        {projects.items.map((project, index) => {
          const descriptionKey =
            projectDescriptionKeys[project.title as keyof typeof projectDescriptionKeys];
          const localizedProject =
            locale !== "en" && descriptionKey
              ? { ...project, description: t(`descriptions.${descriptionKey}`) }
              : project;

          return (
            <li key={`${project.title}-${project.year}`}>
              <ProjectItem project={localizedProject} index={index + 1} />
            </li>
          );
        })}
        {projects.total === 0 && <li className="py-10 text-sm text-muted">{t("empty")}</li>}
      </ul>
    </PageTransition>
  );
}
