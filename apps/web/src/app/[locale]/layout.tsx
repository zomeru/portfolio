import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { getPublicPortfolioSnapshot, getPublicProfile } from "@portfolio/api/public-portfolio";
import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteNav } from "@/components/layout/site-nav";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { buildSearchIndex, type SearchIndexCopy } from "@/features/search/lib/build-index";
import {
  languageAlternates,
  locales,
  localizedPath,
  openGraphLocales,
  routing,
} from "@/i18n/routing";
import { siteUrl } from "@/lib/metadata";
import { experienceTranslationKeys, projectTranslationKeys } from "@/lib/portfolio-content";

import "../globals.css";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const [profile, t] = await Promise.all([
    getPublicProfile(),
    getTranslations({ locale, namespace: "Metadata.root" }),
  ]);
  const name = profile?.name || "Portfolio";
  const role = locale === "en" && profile?.role ? profile.role : t("role");
  const description = locale === "en" && profile?.biography ? profile.biography : t("description");
  const canonicalPath = localizedPath("/", locale);

  return {
    metadataBase: siteUrl,
    applicationName: name,
    title: { default: `${name} — ${role}`, template: `%s — ${name}` },
    description,
    authors: [{ name, url: siteUrl }],
    creator: name,
    publisher: name,
    appleWebApp: { capable: true, statusBarStyle: "default", title: name },
    alternates: { canonical: canonicalPath, languages: languageAlternates("/") },
    verification: { google: "vIm46RcPpRP4YQjS20F6RUACLwKggpLpEwLKn3rMXVw" },
    openGraph: {
      title: `${name} — ${role}`,
      description,
      locale: openGraphLocales[locale],
      alternateLocale: locales
        .filter((candidate) => candidate !== locale)
        .map((candidate) => openGraphLocales[candidate]),
      type: "website",
      siteName: name,
      url: new URL(canonicalPath, siteUrl),
    },
    twitter: { card: "summary_large_image", title: `${name} — ${role}`, description },
  };
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [snapshot, messages, t, tSearch, tExperience, tProjects] = await Promise.all([
    getPublicPortfolioSnapshot(),
    getMessages(),
    getTranslations("Common"),
    getTranslations("Common.search"),
    getTranslations("Experience"),
    getTranslations("Projects"),
  ]);
  const { profile, techStack } = snapshot;
  const searchCopy = {
    actions: {
      book: {
        title: tSearch("actions.book.title"),
        description: tSearch("actions.book.description"),
      },
      languages: {
        en: {
          title: tSearch("actions.languages.en.title"),
          description: tSearch("actions.languages.en.description"),
        },
        ja: {
          title: tSearch("actions.languages.ja.title"),
          description: tSearch("actions.languages.ja.description"),
        },
        "zh-CN": {
          title: tSearch("actions.languages.zh-CN.title"),
          description: tSearch("actions.languages.zh-CN.description"),
        },
        de: {
          title: tSearch("actions.languages.de.title"),
          description: tSearch("actions.languages.de.description"),
        },
      },
      theme: {
        title: tSearch("actions.theme.title"),
        description: tSearch("actions.theme.description"),
      },
    },
    pages: Object.fromEntries(
      (["assistant", "blogs", "contact", "developers", "github", "home", "projects"] as const).map(
        (key) => [
          key,
          {
            title: tSearch(`pages.${key}.title`),
            description: tSearch(`pages.${key}.description`),
          },
        ],
      ),
    ) as SearchIndexCopy["pages"],
    profile: Object.fromEntries(
      (["email", "github", "linkedin", "resume"] as const).map((key) => [
        key,
        {
          title: tSearch(`profile.${key}.title`),
          description: tSearch(`profile.${key}.description`),
        },
      ]),
    ) as SearchIndexCopy["profile"],
  } satisfies SearchIndexCopy;
  const searchItems = buildSearchIndex(snapshot, searchCopy, {
    experience: Object.fromEntries(
      Object.entries(experienceTranslationKeys).map(([company, key]) => [
        company,
        {
          period: tExperience(`entries.${key}.period`),
          role: tExperience(`entries.${key}.role`),
        },
      ]),
    ),
    projects: Object.fromEntries(
      Object.entries(projectTranslationKeys).map(([title, key]) => [
        title,
        tProjects(`descriptions.${key}`),
      ]),
    ),
  });
  const clientMessages = {
    Assistant: messages.Assistant,
    Blogs: messages.Blogs,
    Common: messages.Common,
    Contact: messages.Contact,
    Errors: messages.Errors,
    Github: messages.Github,
  };

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(geistSans.variable, geistMono.variable, "antialiased")}
    >
      <GoogleTagManager gtmId="GTM-PV9CX97P" />
      <body>
        <NextIntlClientProvider locale={locale} messages={clientMessages}>
          <ThemeProvider>
            <ServiceWorkerRegistration />
            <a
              href="#main-content"
              className="sr-only fixed left-4 top-4 z-50 rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background focus:not-sr-only"
            >
              {t("skipToContent")}
            </a>
            <div className="flex min-h-dvh flex-col">
              <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 sm:px-8">
                <SiteHeader profile={profile} techStack={techStack} />
                <SiteNav searchItems={searchItems} />
                <main id="main-content" tabIndex={-1} className="flex-1 scroll-mt-4 py-12 sm:py-16">
                  {children}
                </main>
                <SiteFooter profile={profile} />
              </div>
            </div>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
      <GoogleAnalytics gaId="G-XNJS2S5JPX" />
    </html>
  );
}
