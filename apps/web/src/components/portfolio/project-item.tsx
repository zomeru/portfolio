import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type { Project } from "@/data/projects";

type ProjectItemProps = {
  project: Project;
  index: number;
};

export function ProjectItem({ project, index }: ProjectItemProps) {
  const number = String(index).padStart(2, "0");

  return (
    <article className="py-10 sm:py-12">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-xs text-muted">{number}</p>
        <p className="font-mono text-xs text-muted">{project.year}</p>
      </div>
      <h2 className="mt-3 text-xl font-medium tracking-tight">{project.title}</h2>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">{project.description}</p>
      <p className="mt-4 font-mono text-xs text-muted">{project.tech.join(" · ")}</p>
      {(project.github || project.live || project.caseStudy) && (
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {project.github && <ExternalLink href={project.github}>GitHub</ExternalLink>}
          {project.live && <ExternalLink href={project.live}>Live</ExternalLink>}
          {project.caseStudy && (
            <Link
              href={project.caseStudy}
              className="inline-flex items-center gap-1 text-foreground underline-offset-4 transition-colors duration-200 hover:text-muted motion-reduce:transition-none"
            >
              Case study <ArrowUpRight size={14} />
            </Link>
          )}
        </div>
      )}
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
      {children} <ArrowUpRight size={14} />
    </a>
  );
}
