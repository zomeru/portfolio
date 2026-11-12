import "@tanstack/react-start/server-only";
import { defaultLocale, isLocale, localeCookieName, localizedPath, type Locale } from "./routing";

const countryLocales: Partial<Record<string, Locale>> = { CN: "zh-CN", DE: "de", JP: "ja" };
const languageLocales: Partial<Record<string, Locale>> = {
  en: "en",
  de: "de",
  ja: "ja",
  zh: "zh-CN",
};

export function localeRedirect(request: Request) {
  if (request.method !== "GET" && request.method !== "HEAD") return undefined;
  const url = new URL(request.url);
  const segment = url.pathname.split("/")[1];
  if (segment === "api" || segment === "admin" || url.pathname.includes(".")) return undefined;
  if (/(?:^|\/)(?:opengraph-image|twitter-image)$/.test(url.pathname)) return undefined;

  const explicit = segment && isLocale(segment) ? segment : undefined;
  const cookie = request.headers
    .get("cookie")
    ?.match(new RegExp(`(?:^|;\\s*)${localeCookieName}=([^;]*)`))?.[1];
  const saved = cookie && isLocale(cookie) ? cookie : undefined;
  const languages = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((entry) => {
      const [tag, quality] = entry.trim().toLowerCase().split(";q=");
      return {
        locale: languageLocales[tag?.split("-")[0] ?? ""],
        weight: quality === undefined ? 1 : Number(quality),
      };
    })
    .sort((a, b) => b.weight - a.weight);
  const detected =
    languages.find(({ locale, weight }) => locale && weight > 0)?.locale ??
    countryLocales[(request.headers.get("cf-ipcountry") ?? "").toUpperCase()] ??
    defaultLocale;
  const locale = explicit ?? saved ?? detected;
  const path = explicit ? url.pathname.slice(explicit.length + 1) || "/" : url.pathname;
  const canonical = localizedPath(path, locale);
  const needsCookie = explicit && locale !== (saved ?? detected);
  if (canonical === url.pathname && !needsCookie) return undefined;

  const headers = new Headers({
    "Cache-Control": "private, no-store",
    Vary: "Cookie, Accept-Language, CF-IPCountry",
  });
  if (needsCookie) {
    headers.append(
      "Set-Cookie",
      `${localeCookieName}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${url.protocol === "https:" ? "; Secure" : ""}`,
    );
  }
  if (canonical === url.pathname) return headers;
  url.pathname = canonical;
  headers.set("Location", url.href);
  return new Response(null, { status: 307, headers });
}
