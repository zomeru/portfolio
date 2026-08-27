import { defineRouting } from "next-intl/routing";

export const locales = ["en", "ja", "zh-CN", "de"] as const;
export const defaultLocale = "en";
export const localeCookieName = "PORTFOLIO_LOCALE";

export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeCookie: {
    name: localeCookieName,
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
  },
  alternateLinks: true,
});

export const localeCodes: Record<Locale, string> = {
  en: "EN",
  ja: "JA",
  "zh-CN": "ZH",
  de: "DE",
};

export const openGraphLocales: Record<Locale, string> = {
  en: "en_US",
  ja: "ja_JP",
  "zh-CN": "zh_CN",
  de: "de_DE",
};

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

export function localizedPath(path: string, locale: Locale) {
  const normalizedPath = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalizedPath}`;
}

export function languageAlternates(path: string) {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, localizedPath(path, locale)])),
    "x-default": localizedPath(path, defaultLocale),
  };
}
