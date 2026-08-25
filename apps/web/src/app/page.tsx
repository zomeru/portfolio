import { getPublicProfile, listPublicExperience } from "@portfolio/api/public-portfolio";
import { PageTransition } from "@/components/layout/page-transition";
import { ExperienceItem } from "@/components/portfolio/experience-item";
import { PageHeader } from "@/components/portfolio/page-header";

export default async function AboutPage() {
  const [profile, experience] = await Promise.all([getPublicProfile(), listPublicExperience()]);

  return (
    <PageTransition>
      <PageHeader
        index="01"
        eyebrow="About"
        title={profile?.biography || "Profile content is unavailable."}
      />
      {profile?.about && (
        <p className="mt-3 max-w-xl whitespace-pre-line text-sm leading-relaxed text-muted">
          {profile.about}
        </p>
      )}

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
          {experience.items.map((job) => (
            <li key={`${job.company}-${job.role}-${job.period}`} className="pb-8 last:pb-0">
              <ExperienceItem job={job} />
            </li>
          ))}
          {experience.total === 0 && (
            <li className="pl-7 text-sm text-muted">No experience entries are published yet.</li>
          )}
        </ol>
      </section>
    </PageTransition>
  );
}
