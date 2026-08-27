"use client";

import { localizedPath, type Locale } from "@/i18n/routing";

export function replaceLocale(pathname: string, locale: Locale) {
  const href = `${localizedPath(pathname, locale)}${window.location.search}${window.location.hash}`;
  window.location.replace(href);
}
