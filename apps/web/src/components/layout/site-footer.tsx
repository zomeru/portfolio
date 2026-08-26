import type { PublicProfile } from "@portfolio/api/public-portfolio";

import { appVersion } from "@/lib/app-version";
import { getProfileSocials } from "@/lib/sanity/profile";

export function SiteFooter({ profile }: { profile: PublicProfile | null }) {
  const footerSocials = profile
    ? getProfileSocials(profile).filter((social) => social.name !== "Email")
    : [];
  return (
    <footer className="border-t border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 py-6 text-sm text-muted">
        <p className="flex items-center gap-2">
          © {new Date().getFullYear()} {profile?.name ? `${profile.name}. ` : ""}
          <span>v{appVersion}</span>
        </p>
        <ul className="flex items-center gap-3">
          {footerSocials.map((social) => (
            <li key={social.name}>
              <a
                href={social.href}
                className="inline-flex min-h-6 items-center underline-offset-4 transition-colors duration-200 hover:text-foreground hover:underline motion-reduce:transition-none"
                target="_blank"
                rel="noopener noreferrer"
              >
                {social.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
