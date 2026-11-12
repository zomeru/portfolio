import { createFileRoute } from "@tanstack/react-router";
import { useTranslations } from "use-intl";

import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/portfolio/page-header";
import { ProjectItem } from "@/components/portfolio/project-item";
import { translatedHead } from "@/lib/localized-head";
import { projectTranslationKeys } from "@/lib/portfolio-content";
import { getProjects } from "@/lib/public.functions";

export const Route = createFileRoute("/{-$locale}/projects/")({
  loader: () => getProjects(),
  head: (input) =>
    translatedHead(input, "projects", "/projects", { imagePath: "/projects/opengraph-image" }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { locale } = Route.useRouteContext();
  const projects = Route.useLoaderData();
  const t = useTranslations("Projects");
  return (
    <PageTransition>
      <PageHeader index="02" eyebrow={t("eyebrow")} title={t("title")} />
      <ul className="mt-10 divide-y divide-border border-t border-border">
        {projects.items.map((project, index) => {
          const descriptionKey =
            projectTranslationKeys[project.title as keyof typeof projectTranslationKeys];
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
