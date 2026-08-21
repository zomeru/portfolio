import { ArrowUpRight, ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { imageUrlFor } from "@/lib/sanity/image";
import type { Project } from "@/lib/sanity/types";

type ProjectItemProps = {
  project: Project;
  index: number;
};

export function ProjectItem({ project, index }: ProjectItemProps) {
  const number = String(index).padStart(2, "0");
  const blurDataURL = project.image?.asset?.metadata?.lqip;

  return (
    <article className="grid gap-5 py-7 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start sm:gap-6 sm:py-8">
      <div className="relative aspect-4/3 w-full max-w-64 overflow-hidden rounded-md border border-border bg-muted/30  outline-1 outline-black/10 dark:outline-white/10">
        {project.image?.asset ? (
          <Image
            src={imageUrlFor(project.image).width(704).height(528).fit("crop").url()}
            alt={project.image.alt || project.title}
            fill
            sizes="(min-width: 640px) 11rem, min(16rem, calc(100vw - 2rem))"
            className="object-cover"
            {...(blurDataURL ? { placeholder: "blur" as const, blurDataURL } : {})}
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted">
            <ImageIcon aria-hidden="true" size={24} strokeWidth={1.5} />
            <span className="text-sm">Project image unavailable</span>
          </div>
        )}
      </div>
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
