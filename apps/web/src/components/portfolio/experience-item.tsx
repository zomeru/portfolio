import type { PublicExperience } from "@portfolio/api/public-portfolio";

import { Link } from "@/i18n/navigation";

export function ExperienceItem({ job }: { job: PublicExperience }) {
  return (
    <Link
      href={`/work/${job.slug}`}
      className="group relative block rounded-sm pl-7 outline-offset-4 focus-visible:outline-2 focus-visible:outline-foreground"
    >
      <article>
        <span aria-hidden className="absolute left-0 top-1.5 size-2.5 rounded-full bg-foreground" />
        <p className="font-mono text-xs text-muted">{job.period}</p>
        <h3 className="mt-1 text-lg font-medium tracking-tight">
          <span className="transition-colors duration-150 group-hover:text-muted motion-reduce:transition-none">
            {job.role}
          </span>
        </h3>
        <p className="mt-0.5 text-sm text-muted">{job.company}</p>
        {job.technologies.length > 0 && (
          <p className="mt-2 font-mono text-xs text-muted">{job.technologies.join(" · ")}</p>
        )}
      </article>
    </Link>
  );
}
