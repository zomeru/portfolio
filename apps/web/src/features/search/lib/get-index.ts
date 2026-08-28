import "server-only";
import { getPublicPortfolioSnapshot } from "@portfolio/api/public-portfolio";
import { getTranslations } from "next-intl/server";

import { type Locale } from "@/i18n/routing";
import { experienceTranslationKeys, projectTranslationKeys } from "@/lib/portfolio-content";

import { buildSearchIndex, type SearchIndexCopy } from "./build-index";

export async function getSearchIndex(locale: Locale) {
  const [snapshot, tSearch, tExperience, tProjects] = await Promise.all([
    getPublicPortfolioSnapshot(),
    getTranslations({ locale, namespace: "Common.search" }),
    getTranslations({ locale, namespace: "Experience" }),
    getTranslations({ locale, namespace: "Projects" }),
  ]);
  const copy = {
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

  return buildSearchIndex(snapshot, copy, {
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
}
