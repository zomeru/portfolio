import type { PublicProfile, PublicTechStackGroup } from "@portfolio/api/public-portfolio";
import { ArrowUpRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { MobileHeaderControls } from "@/components/layout/mobile-header-controls";
import { PublicProfileImage } from "@/components/portfolio/public-profile-image";
import { SocialLinks } from "@/components/portfolio/social-links";
import { TechStack } from "@/components/portfolio/tech-stack";
import { getProfileSocials } from "@/lib/sanity/profile";

const AVATAR_SIZE = 512;

type SiteHeaderProps = {
  profile: PublicProfile | null;
  searchEndpoint?: string;
  showLanguagePicker?: boolean;
  techStack: readonly PublicTechStackGroup[];
};

export async function SiteHeader({
  profile,
  searchEndpoint,
  showLanguagePicker = true,
  techStack,
}: SiteHeaderProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("Common")]);
  const socials = profile ? getProfileSocials(profile) : [];
  const resumeUrl = profile?.resumePdfUrl ?? "/assets/GREGORIO_ZOMER_RESUME.pdf";

  return (
    <header className="border-b border-border">
      <div className="relative grid gap-10 py-10 sm:py-12 md:grid-cols-2 md:gap-16">
        <div className="flex flex-col items-start gap-5">
          {profile && (
            <div className="relative size-24 overflow-hidden rounded-full border border-border">
              <PublicProfileImage
                value={profile.photo}
                size={AVATAR_SIZE}
                priority
                className="block size-full object-cover"
              />
            </div>
          )}
          {profile && (
            <div>
              {profile.name && (
                <p className="text-2xl font-medium tracking-tight">{profile.name}</p>
              )}
              {profile.role && (
                <p className="mt-0.5 text-base text-muted">
                  {locale === "en" ? profile.role : t("profileRole")}
                </p>
              )}
            </div>
          )}
          {profile && (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-base font-medium underline-offset-4 transition-colors duration-200 hover:text-muted motion-reduce:transition-none"
            >
              {t("resume")} <ArrowUpRight aria-hidden="true" size={16} />
            </a>
          )}
          {socials.length > 0 && (
            <SocialLinks
              items={socials}
              labels={{
                Email: t("social.email"),
                GitHub: t("search.profile.github.title"),
                LinkedIn: t("search.profile.linkedin.title"),
              }}
              className="flex items-center"
            />
          )}
        </div>
        <MobileHeaderControls
          hasTechStack={techStack.length > 0}
          searchEndpoint={searchEndpoint}
          showLanguagePicker={showLanguagePicker}
        >
          {techStack.length > 0 ? <TechStack groups={techStack} /> : null}
        </MobileHeaderControls>
      </div>
    </header>
  );
}
