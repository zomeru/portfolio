"use client";

import { useTranslations } from "next-intl";

import { LanguagePicker } from "@/components/layout/language-picker";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "about" },
  { href: "/projects", label: "projects" },
  { href: "/blogs", label: "blogs" },
  { href: "/github-contributions", label: "github" },
  { href: "/ask", label: "assistant" },
  { href: "/contact", label: "contact" },
] as const;

export function SiteNav({ showLanguagePicker = true }: { showLanguagePicker?: boolean }) {
  const pathname = usePathname();
  const t = useTranslations("Common.nav");

  return (
    <nav aria-label={t("label")} className="border-b border-border py-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <ul className="flex flex-wrap items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "cursor-pointer inline-flex items-center rounded-full pr-2.5 py-1.5 text-sm text-muted transition-colors duration-200 motion-reduce:transition-none",
                    isActive
                      ? "text-foreground underline underline-offset-4"
                      : "hover:text-foreground",
                  )}
                >
                  {t(link.label)}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-2">
          {showLanguagePicker && <LanguagePicker />}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
