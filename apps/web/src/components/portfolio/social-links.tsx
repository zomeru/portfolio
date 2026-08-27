import type { LucideIcon } from "lucide-react";
import { Mail } from "lucide-react";

import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import type { ProfileSocial } from "@/lib/sanity/profile";
import { cn } from "@/lib/utils";

const socialIcons: Record<ProfileSocial["name"], LucideIcon | typeof GitHubIcon> = {
  Email: Mail,
  GitHub: GitHubIcon,
  LinkedIn: LinkedInIcon,
};

type SocialLinksProps = {
  items: readonly ProfileSocial[];
  className?: string;
  emailLabel?: string;
};

export function SocialLinks({ items, className, emailLabel = "Email" }: SocialLinksProps) {
  return (
    <ul className={cn(className, "gap-4")}>
      {items.map((social) => {
        const Icon = socialIcons[social.name];
        const isMailto = social.href.startsWith("mailto:");
        return (
          <li key={social.name}>
            <a
              href={social.href}
              aria-label={social.name === "Email" ? emailLabel : social.name}
              className="inline-flex items-center justify-center text-muted transition-colors duration-200 hover:text-foreground motion-reduce:transition-none"
              {...(isMailto ? {} : { target: "_blank", rel: "noopener noreferrer" })}
            >
              <Icon size={24} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
