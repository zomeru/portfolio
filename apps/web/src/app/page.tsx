import type { Metadata } from "next";

import { ExperienceItem } from "@/components/portfolio/experience-item";
import { PageHeader } from "@/components/portfolio/page-header";
import { experience } from "@/data/experience";
import { profile } from "@/data/profile";

export const metadata: Metadata = {
  title: `About — ${profile.name}`,
  description:
    "Full-stack software engineer focused on building modern web applications and scalable systems.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        index="01"
        eyebrow="About"
        title="I'm Zomer, a full-stack software engineer focused on building modern web applications and scalable systems."
      />
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        I work across frontend, backend, databases, infrastructure, and developer tooling.
      </p>

      <section aria-labelledby="experience-heading" className="mt-16">
        <h2
          id="experience-heading"
          className="font-mono text-xs uppercase tracking-widest text-muted"
        >
          Experience
        </h2>
        <ol className="relative mt-3">
          <span
            aria-hidden
            className="absolute bottom-2 left-1 top-2 w-0.5 bg-linear-to-b from-border via-border to-transparent"
          />
          {experience.map((job) => (
            <li key={`${job.role}-${job.period}`} className="pb-8 last:pb-0">
              <ExperienceItem job={job} />
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
