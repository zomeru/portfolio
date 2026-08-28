"use client";

import { useTranslations } from "next-intl";

import { LanguagePicker } from "@/components/layout/language-picker";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SearchController } from "@/features/search/components/search-controller";
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

export function SiteNav({
  searchEndpoint,
  showLanguagePicker = true,
}: {
  searchEndpoint?: string;
  showLanguagePicker?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations("Common");

  return (
    <nav aria-label={t("nav.label")} className="border-b border-border py-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <ul className="flex flex-wrap items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={link.label === "github" ? t("search.pages.github.title") : undefined}
                  className={cn(
                    "inline-flex sscursor-pointer items-center rounded-full pr-2.5 text-sm text-muted transition-colors duration-200 motion-reduce:transition-none min-h-8 md:py-1.5",
                    isActive
                      ? "text-foreground underline underline-offset-4"
                      : "hover:text-foreground",
                  )}
                >
                  {t(`nav.${link.label}`)}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="hidden items-center gap-2 md:flex">
          {searchEndpoint ? <SearchController endpoint={searchEndpoint} /> : null}
          {showLanguagePicker ? <LanguagePicker /> : null}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
