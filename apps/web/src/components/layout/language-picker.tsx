"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { usePathname } from "@/i18n/navigation";
import { localeCodes, locales, localizedPath, type Locale } from "@/i18n/routing";

export function LanguagePicker() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Common.language");
  const [pending, setPending] = useState(false);

  function switchLocale(nextLocale: Locale) {
    if (nextLocale === locale) return;

    setPending(true);
    const href = `${localizedPath(pathname, nextLocale)}${window.location.search}${window.location.hash}`;

    // Reinitialize the locale root document so <html lang> and bootstrap scripts match the locale.
    window.location.replace(href);
  }

  return (
    <label className="relative inline-flex min-h-8 items-center border border-border">
      <span className="sr-only">{pending ? t("switching") : t("label")}</span>
      <select
        value={locale}
        disabled={pending}
        aria-label={t("label")}
        onChange={(event) => switchLocale(event.currentTarget.value as Locale)}
        className="min-h-8 cursor-pointer appearance-none bg-background py-1 pr-6 pl-2 font-mono text-[11px] font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        {locales.map((candidate) => (
          <option key={candidate} value={candidate}>
            {localeCodes[candidate]}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2 size-1.5 rotate-45 border-r border-b border-foreground"
      />
    </label>
  );
}
