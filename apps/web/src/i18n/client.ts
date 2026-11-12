import { localeCookieName, localizedPath, type Locale } from "@/i18n/routing";

export function replaceLocale(pathname: string, locale: Locale) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax${secure}`;
  const href = `${localizedPath(pathname, locale)}${window.location.search}${window.location.hash}`;
  window.location.replace(href);
}
