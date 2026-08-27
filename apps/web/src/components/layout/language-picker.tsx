"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Select } from "@/components/ui/select";
import { replaceLocale } from "@/i18n/client";
import { usePathname } from "@/i18n/navigation";
import { localeCodes, locales, type Locale } from "@/i18n/routing";

export function LanguagePicker() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Common.language");
  const [pending, setPending] = useState(false);

  function switchLocale(nextLocale: Locale) {
    if (nextLocale === locale) return;

    setPending(true);
    replaceLocale(pathname, nextLocale);
  }

  return (
    <Select
      id="portfolio-language"
      label={pending ? t("switching") : t("label")}
      labelClassName="sr-only"
      value={locale}
      disabled={pending}
      iconSize={14}
      options={locales.map((candidate) => ({
        label: localeCodes[candidate],
        value: candidate,
      }))}
      onValueChangeAction={(value) => switchLocale(value as Locale)}
      className="inline-grid gap-0"
      triggerClassName="min-h-8 w-auto gap-2 rounded-none px-2 font-mono text-[11px] font-medium hover:bg-border/40"
      contentClassName="mt-0 mb-1 min-w-24 rounded-none"
    />
  );
}
