import type { PublicProject } from "@portfolio/api/public-portfolio";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

type ProjectItemProps = {
  project: PublicProject;
  index: number;
};

export function ProjectItem({ project, index }: ProjectItemProps) {
  const number = String(index).padStart(2, "0");

  return (
    <article className="py-7 sm:py-8">
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-xs text-muted">{number}</p>
          <p className="font-mono text-xs text-muted">{project.year}</p>
        </div>
        <h2 className="mt-2 text-lg font-medium tracking-tight">{project.title}</h2>
        <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted">
          {project.description}
        </p>
        <p className="mt-3 font-mono text-xs text-muted">{project.technologies.join(" · ")}</p>
        {(project.repositoryUrl || project.demoUrl || project.caseStudyUrl) && (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {project.repositoryUrl && (
              <ExternalLink href={project.repositoryUrl}>GitHub</ExternalLink>
            )}
            {project.demoUrl && <ExternalLink href={project.demoUrl}>Live</ExternalLink>}
            {project.caseStudyUrl && (
              <Link
                href={project.caseStudyUrl}
                className="inline-flex items-center gap-1 text-foreground underline-offset-4 transition-colors duration-200 hover:text-muted motion-reduce:transition-none"
              >
                Case study <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-foreground underline-offset-4 transition-colors duration-200 hover:text-muted motion-reduce:transition-none"
    >
      {children} <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
    </a>
  );
}
