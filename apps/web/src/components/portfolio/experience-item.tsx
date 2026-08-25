import type { PublicExperience } from "@portfolio/api/public-portfolio";

export function ExperienceItem({ job }: { job: PublicExperience }) {
  return (
    <article className="relative pl-7">
      <span aria-hidden className="absolute left-0 top-1.5 size-2.5 rounded-full bg-foreground" />
      <p className="font-mono text-xs text-muted">{job.period}</p>
      <h3 className="mt-1 text-lg font-medium tracking-tight">{job.role}</h3>
      <p className="mt-0.5 text-sm text-muted">{job.company}</p>
      {job.technologies && job.technologies.length > 0 && (
        <p className="mt-2 font-mono text-xs text-muted">{job.technologies.join(" · ")}</p>
      )}
    </article>
  );
}
