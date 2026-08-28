import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import {
  isLocale,
  localeCookieName,
  locales,
  localizedPath,
  routing,
  type Locale,
} from "@/i18n/routing";

const handleInternationalization = createMiddleware(routing);

const countryLocales: Partial<Record<string, Locale>> = {
  CN: "zh-CN",
  DE: "de",
  JP: "ja",
};

function pathnameHasLocale(pathname: string) {
  return locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
}

function acceptLanguageHasSupportedLocale(header: string | null) {
  if (!header) return false;

  return header.split(",").some((entry) => {
    const language = entry.split(";", 1)[0]?.trim().toLowerCase();
    if (!language) return false;
    return (
      language === "en" ||
      language.startsWith("en-") ||
      language === "de" ||
      language.startsWith("de-") ||
      language === "ja" ||
      language.startsWith("ja-") ||
      language === "zh" ||
      language.startsWith("zh-")
    );
  });
}

function countryLocale(request: NextRequest) {
  const country =
    request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry") ?? "";
  return countryLocales[country.toUpperCase()];
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/error" || pathname.startsWith("/admin/error/")) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  }

  const selectedLocale = request.cookies.get(localeCookieName)?.value;
  const hasSelectedLocale = Boolean(selectedLocale && isLocale(selectedLocale));

  if (
    !pathnameHasLocale(pathname) &&
    !hasSelectedLocale &&
    !acceptLanguageHasSupportedLocale(request.headers.get("accept-language"))
  ) {
    const locale = countryLocale(request);
    if (locale) {
      const url = request.nextUrl.clone();
      url.pathname = localizedPath(pathname, locale);
      return NextResponse.redirect(url);
    }
  }

  return handleInternationalization(request);
}

export const config = {
  matcher: ["/admin/error/:path*", "/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
