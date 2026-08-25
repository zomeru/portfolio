import { PageTransition } from "@/components/layout/page-transition";
import { ExperienceItem } from "@/components/portfolio/experience-item";
import { PageHeader } from "@/components/portfolio/page-header";
import { PortableTextContent } from "@/lib/sanity/portable-text";
import { getExperience } from "@/lib/sanity/services/experience";
import { getProfile } from "@/lib/sanity/services/profile";

export default async function AboutPage() {
  const [profile, experience] = await Promise.all([getProfile(), getExperience()]);

  return (
    <PageTransition>
      <PageHeader
        index="01"
        eyebrow="About"
        title={
          profile?.biography ? (
            <PortableTextContent value={profile.biography} variant="inline" />
          ) : (
            "Profile content is unavailable."
          )
        }
      />
      {profile?.aboutContent && (
        <div className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          <PortableTextContent value={profile.aboutContent} />
        </div>
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
          {experience.map((job) => (
            <li key={job._id} className="pb-8 last:pb-0">
              <ExperienceItem job={job} />
            </li>
          ))}
          {experience.length === 0 && (
            <li className="pl-7 text-sm text-muted">No experience entries are published yet.</li>
          )}
        </ol>
      </section>
    </PageTransition>
  );
}
