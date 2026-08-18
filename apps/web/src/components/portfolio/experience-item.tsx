import type { Experience } from "@/data/experience";

export function ExperienceItem({ job }: { job: Experience }) {
  return (
    <article className="relative pl-7">
      <span aria-hidden className="absolute left-0 top-1.5 size-2.5 rounded-full bg-foreground" />
      <p className="font-mono text-xs text-muted">{job.period}</p>
      <h3 className="mt-1 text-lg font-medium tracking-tight">{job.role}</h3>
      <p className="mt-0.5 text-sm text-muted">{job.company}</p>
      <p className="mt-2 font-mono text-xs text-muted">{job.tech.join(" · ")}</p>
    </article>
  );
}
