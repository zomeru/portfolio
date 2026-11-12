import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "use-intl";
import { createTranslator } from "use-intl/core";

import { PageTransition } from "@/components/layout/page-transition";
import { DetailSections } from "@/components/portfolio/detail-sections";
import { Link } from "@/i18n/navigation";
import { localizedPath } from "@/i18n/routing";
import { localizedHead } from "@/lib/localized-head";
import { projectTranslationKeys } from "@/lib/portfolio-content";
import { getProject } from "@/lib/public.functions";

const publicLayout = getRouteApi("/{-$locale}");

export const Route = createFileRoute("/{-$locale}/projects/$slug")({
  loader: ({ params }) => getProject({ data: params.slug }),
  head: (input) => {
    const project = input.loaderData;
    if (!project) return {};
    const t = createTranslator({ ...input.match.context, namespace: "Projects" });
    const key = projectTranslationKeys[project.title as keyof typeof projectTranslationKeys];
    return localizedHead(input, {
      title: project.title,
      description:
        input.match.context.locale !== "en" && key ? t(`descriptions.${key}`) : project.description,
      path: `/projects/${project.slug}`,
      imagePath: "/projects/opengraph-image",
    });
  },
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { locale } = Route.useRouteContext();
  const t = useTranslations("Projects");
  const project = Route.useLoaderData();
  const descriptionKey =
    projectTranslationKeys[project.title as keyof typeof projectTranslationKeys];
  const description =
    locale !== "en" && descriptionKey ? t(`descriptions.${descriptionKey}`) : project.description;
  const canonicalUrl = new URL(
    localizedPath(`/projects/${project.slug}`, locale),
    publicLayout.useLoaderData().siteUrl,
  ).href;
  const jsonLd = {
    "@context": "https://schema.org",
    "@id": `${canonicalUrl}#project`,
    "@type": "CreativeWork",
    dateCreated: project.year,
    description,
    keywords: project.technologies,
    name: project.title,
    url: canonicalUrl,
  };

  return (
    <PageTransition>
      <article>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }}
        />
        <Link
          href="/projects"
          className="font-mono text-xs text-muted underline-offset-4 transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
        >
          ← {t("detail.back")}
        </Link>

        <div className="mt-8 flex items-center justify-between gap-4 font-mono text-xs uppercase tracking-widest text-muted">
          <p>{t("detail.eyebrow")}</p>
          <p>{project.year}</p>
        </div>
        <h1 className="mt-3 text-balance text-2xl font-medium leading-snug tracking-tight sm:text-3xl">
          {project.title}
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>

        {project.technologies.length > 0 ? (
          <section aria-labelledby="project-technologies" className="mt-12">
            <h2 id="project-technologies" className="text-lg font-medium tracking-tight">
              {t("detail.technologies")}
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {project.technologies.map((technology) => (
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

        <DetailSections sections={project.details} />

        {project.repositoryUrl || project.demoUrl || project.caseStudyUrl ? (
          <section className="mt-14 border-t border-border pt-6">
            <h2 className="text-lg font-medium tracking-tight">{t("detail.links")}</h2>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-3 text-sm">
              {project.demoUrl ? (
                <li>
                  <ExternalLink href={project.demoUrl} newTabLabel={t("detail.opensNewTab")}>
                    {t("live")}
                  </ExternalLink>
                </li>
              ) : null}
              {project.repositoryUrl ? (
                <li>
                  <ExternalLink href={project.repositoryUrl} newTabLabel={t("detail.opensNewTab")}>
                    {t("detail.repository")}
                  </ExternalLink>
                </li>
              ) : null}
              {project.caseStudyUrl ? (
                <li>
                  <ExternalLink href={project.caseStudyUrl} newTabLabel={t("detail.opensNewTab")}>
                    {t("caseStudy")}
                  </ExternalLink>
                </li>
              ) : null}
            </ul>
          </section>
        ) : null}
      </article>
    </PageTransition>
  );
}

function ExternalLink({
  href,
  children,
  newTabLabel,
}: {
  href: string;
  children: React.ReactNode;
  newTabLabel: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 underline-offset-4 transition-colors duration-150 hover:text-muted motion-reduce:transition-none"
    >
      {children}
      <span className="sr-only"> {newTabLabel}</span>
      <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
    </a>
  );
}
