import type { LucideIcon } from "lucide-react";
import { Mail } from "lucide-react";

import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import type { Social } from "@/data/socials";
import { socials } from "@/data/socials";
import { cn } from "@/lib/utils";

const socialIcons: Record<Social["name"], LucideIcon | typeof GitHubIcon> = {
  Email: Mail,
  GitHub: GitHubIcon,
  LinkedIn: LinkedInIcon,
};

type SocialLinksProps = {
  items?: readonly Social[];
  className?: string;
};

export function SocialLinks({ items = socials, className }: SocialLinksProps) {
  return (
    <ul className={cn(className, "gap-3")}>
      {items.map((social) => {
        const Icon = socialIcons[social.name];
        const isMailto = social.href.startsWith("mailto:");
        return (
          <li key={social.name}>
            <a
              href={social.href}
              aria-label={social.name}
              className="inline-flex items-center justify-center text-muted transition-colors duration-200 hover:text-foreground motion-reduce:transition-none"
              {...(isMailto ? {} : { target: "_blank", rel: "noopener noreferrer" })}
            >
              <Icon size={22} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
