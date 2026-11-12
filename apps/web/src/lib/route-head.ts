import {
  languageAlternates,
  localizedPath,
  locales,
  openGraphLocales,
  type Locale,
} from "@/i18n/routing";

type PageHeadOptions = {
  title: string;
  description: string;
  locale: Locale;
  path: string;
  siteUrl: string;
  siteName?: string;
  imagePath?: string;
  article?: { date: string; tags: string[] };
  noindex?: boolean;
};

export function pageHead({
  title,
  description,
  locale,
  path,
  siteUrl,
  siteName = "Zomer Gregorio",
  imagePath = "/opengraph-image",
  article,
  noindex,
}: PageHeadOptions) {
  const absolute = (url: string) => new URL(url, siteUrl).href;
  const canonical = absolute(localizedPath(path, locale));
  const image = absolute(localizedPath(imagePath, locale));

  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:locale", content: openGraphLocales[locale] },
      ...locales
        .filter((value) => value !== locale)
        .map((value) => ({ property: "og:locale:alternate", content: openGraphLocales[value] })),
      { property: "og:site_name", content: siteName },
      { property: "og:type", content: article ? "article" : "website" },
      { property: "og:url", content: canonical },
      { property: "og:image", content: image },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      ...(article
        ? [
            { property: "article:published_time", content: article.date },
            ...article.tags.map((tag) => ({ property: "article:tag", content: tag })),
          ]
        : []),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image.replace(/\/opengraph-image$/, "/twitter-image") },
    ],
    links: [
      { rel: "canonical", href: canonical },
      ...Object.entries(languageAlternates(path)).map(([hrefLang, href]) => ({
        rel: "alternate",
        hrefLang,
        href: absolute(href),
      })),
    ],
  };
}

type HeadMatch = { routeId: string; loaderData?: unknown };

export function getSiteMatch(matches: ReadonlyArray<HeadMatch>) {
  return matches.find(({ routeId }) => routeId === "__root__")?.loaderData as
    | Awaited<ReturnType<typeof import("./site.functions").getSiteData>>
    | undefined;
}
