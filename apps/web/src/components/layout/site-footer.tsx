import { SocialLinks } from "@/components/portfolio/social-links";
import { profile } from "@/data/profile";
import { socials } from "@/data/socials";

const footerSocials = socials.filter((social) => social.name !== "Email");

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 py-6 text-sm text-muted">
        <p>
          © {new Date().getFullYear()} {profile.name}.
        </p>
        <SocialLinks items={footerSocials} className="flex items-center" />
      </div>
    </footer>
  );
}
