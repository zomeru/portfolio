"use client";

import { localeCookieName, localizedPath, type Locale } from "@/i18n/routing";

export function replaceLocale(pathname: string, locale: Locale) {
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`;
  const href = `${localizedPath(pathname, locale)}${window.location.search}${window.location.hash}`;
  window.location.replace(href);
}
