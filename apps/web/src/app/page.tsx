import { getPublicProfile } from "@portfolio/api/public-portfolio";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { defaultLocale, isLocale, languageAlternates, localeCookieName } from "@/i18n/routing";
import { siteUrl } from "@/lib/metadata";

const countryLocales: Record<string, string> = {
  CN: "zh-CN",
  DE: "de",
  JP: "ja",
};

function parseAcceptLanguage(header: string | null): string | null {
  if (!header) return null;

  const entries = header
    .split(",")
    .map((entry) => entry.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean) as string[];

  for (const language of entries) {
    if (language === "en" || language.startsWith("en-")) return "en";
    if (language === "de" || language.startsWith("de-")) return "de";
    if (language === "ja" || language.startsWith("ja-")) return "ja";
    if (language === "zh" || language.startsWith("zh-")) return "zh-CN";
  }

  return null;
}

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicProfile();
  const name = profile?.name || "Zomer Gregorio";
  const role = profile?.role || "Software Engineer";
  const title = `${name} - ${role}`;
  const description =
    profile?.biography ||
    "I'm Zomer, a full-stack software engineer focused on building modern web applications and scalable systems.";
  const canonicalPath = "/";

  return {
    metadataBase: new URL(siteUrl),
    applicationName: name,
    title,
    description,
    authors: [{ name, url: siteUrl }],
    creator: name,
    publisher: name,
    appleWebApp: { capable: true, statusBarStyle: "default", title: name },
    alternates: { canonical: canonicalPath, languages: languageAlternates("/") },
    verification: { google: "vIm46RcPpRP4YQjS20F6RUACLwKggpLpEwLKn3rMXVw" },
    openGraph: {
      title,
      description,
      locale: "en_US",
      type: "website",
      siteName: name,
      url: new URL(canonicalPath, siteUrl),
    },
    twitter: { card: "summary_large_image", title, description },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  if (cookieLocale && isLocale(cookieLocale)) {
    redirect(`/${cookieLocale}`);
  }

  const acceptLanguage = headerStore.get("accept-language");
  const negotiatedLocale = parseAcceptLanguage(acceptLanguage);
  if (negotiatedLocale && isLocale(negotiatedLocale)) {
    redirect(`/${negotiatedLocale}`);
  }

  const country = (
    headerStore.get("x-vercel-ip-country") ??
    headerStore.get("cf-ipcountry") ??
    ""
  ).toUpperCase();
  const countryLocale = countryLocales[country];
  if (countryLocale && isLocale(countryLocale)) {
    redirect(`/${countryLocale}`);
  }

  redirect(`/${defaultLocale}`);
}
