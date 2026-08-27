import "server-only";
import { getSiteEnv } from "@portfolio/env/site";
import type { Metadata } from "next";

import {
  languageAlternates,
  localizedPath,
  locales,
  openGraphLocales,
  type Locale,
} from "@/i18n/routing";

export const siteUrl = getSiteEnv().siteUrl;
export const domain = siteUrl.replace(/^https?:\/\//, "");
export const siteUpdatedAt = new Date("2026-08-27");

type PageMetadataOptions = {
  title: string;
  description: string;
  locale: Locale;
  path: string;
};

export function createPageMetadata({
  title,
  description,
  locale,
  path,
}: PageMetadataOptions): Metadata {
  const canonicalPath = localizedPath(path, locale);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: languageAlternates(path),
    },
    openGraph: {
      title,
      description,
      locale: openGraphLocales[locale],
      alternateLocale: locales
        .filter((candidate) => candidate !== locale)
        .map((candidate) => openGraphLocales[candidate]),
      siteName: "Zomer Gregorio",
      type: "website",
      url: new URL(canonicalPath, siteUrl),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
