import { logError } from "@portfolio/api/logging";
import type { GithubCommitPage, GithubContributionCalendar } from "@portfolio/api/types";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageTransition } from "@/components/layout/page-transition";
import {
  GithubCommitHistorySection,
  GithubContributionCalendarSection,
  type GithubLoadResult,
} from "@/components/portfolio/github-contributions-view";
import { PageHeader } from "@/components/portfolio/page-header";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { serverClient } from "@/lib/api-server";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Metadata.github" });
  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/github-contributions",
  });
}

type GithubContributionsPageProps = {
  params: LocaleParams;
  searchParams: Promise<{
    page?: string | string[];
    pageSize?: string | string[];
    repo?: string | string[];
    year?: string | string[];
  }>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function getErrorMessage(response: Response, fallback: string) {
  await response.body?.cancel();
  return fallback;
}

async function loadContributions(
  year: string | undefined,
  fallback: string,
): Promise<GithubLoadResult<GithubContributionCalendar>> {
  try {
    const response = await serverClient.api.github.contributions.$get({
      query: year ? { year } : {},
    });
    if (!response.ok) {
      return {
        data: null,
        error: await getErrorMessage(response, fallback),
      };
    }
    return { data: await response.json(), error: null };
  } catch (error) {
    logError("GitHub contributions could not be loaded for server rendering", error, {
      operation: "web.github.loadContributions",
      ...(year ? { year } : {}),
    });
    return { data: null, error: fallback };
  }
}

async function loadCommits(
  filters: {
    page?: string;
    pageSize?: string;
    repo?: string;
  },
  fallback: string,
): Promise<GithubLoadResult<GithubCommitPage>> {
  try {
    const response = await serverClient.api.github.commits.$get({ query: filters });
    if (!response.ok) {
      return {
        data: null,
        error: await getErrorMessage(response, fallback),
      };
    }
    return { data: await response.json(), error: null };
  } catch (error) {
    logError("GitHub commits could not be loaded for server rendering", error, {
      operation: "web.github.loadCommits",
      filters,
    });
    return { data: null, error: fallback };
  }
}

export default async function GithubContributionsPage({
  params,
  searchParams,
}: GithubContributionsPageProps) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Github" });
  const raw = await searchParams;
  const year = first(raw.year) ?? "";
  const repo = first(raw.repo) ?? "";
  const page = first(raw.page) ?? "";
  const pageSize = first(raw.pageSize) ?? "";
  const [contributions, commitHistory] = await Promise.all([
    loadContributions(year || undefined, t("activityError")),
    loadCommits(
      {
        ...(page ? { page } : {}),
        ...(pageSize ? { pageSize } : {}),
        ...(repo ? { repo } : {}),
      },
      t("commitsError"),
    ),
  ]);

  return (
    <PageTransition>
      <PageHeader index="04" eyebrow={t("eyebrow")} title={t("title")} />
      <GithubContributionCalendarSection initialResult={contributions} initialYear={year} />
      <GithubCommitHistorySection
        initialResult={commitHistory}
        initialFilters={{ page, pageSize, repo }}
      />
    </PageTransition>
  );
}
