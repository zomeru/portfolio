import type { PublicProject } from "@portfolio/api/public-portfolio";
import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

type ProjectItemProps = {
  project: PublicProject;
  index: number;
};

export async function ProjectItem({ project, index }: ProjectItemProps) {
  const t = await getTranslations("Projects");
  const number = String(index).padStart(2, "0");

  return (
    <article className="relative py-7 sm:py-8">
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-xs text-muted">{number}</p>
          <p className="font-mono text-xs text-muted">{project.year}</p>
        </div>
        <h2 className="mt-2 text-lg font-medium tracking-tight">
          <Link
            href={`/projects/${project.slug}`}
            className="group rounded-sm outline-offset-4 after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-foreground"
          >
            <span className="transition-colors duration-150 group-hover:text-muted motion-reduce:transition-none">
              {project.title}
            </span>
            <span className="sr-only"> — {project.description}</span>
          </Link>
        </h2>
        <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted">
          {project.description}
        </p>
        <p className="mt-3 font-mono text-xs text-muted">{project.technologies.join(" · ")}</p>
        {(project.repositoryUrl || project.demoUrl || project.caseStudyUrl) && (
          <div className="relative z-10 mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {project.repositoryUrl && (
              <ExternalLink href={project.repositoryUrl} newTabLabel={t("detail.opensNewTab")}>
                GitHub
              </ExternalLink>
            )}
            {project.demoUrl && (
              <ExternalLink href={project.demoUrl} newTabLabel={t("detail.opensNewTab")}>
                {t("live")}
              </ExternalLink>
            )}
            {project.caseStudyUrl && (
              <ExternalLink href={project.caseStudyUrl} newTabLabel={t("detail.opensNewTab")}>
                {t("caseStudy")}
              </ExternalLink>
            )}
          </div>
        )}
      </div>
    </article>
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
      className="inline-flex items-center gap-1 text-foreground underline-offset-4 transition-colors duration-200 hover:text-muted motion-reduce:transition-none"
    >
      {children}
      <span className="sr-only"> {newTabLabel}</span>
      <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
    </a>
  );
}
