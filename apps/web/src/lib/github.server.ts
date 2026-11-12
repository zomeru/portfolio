import "@tanstack/react-start/server-only";
import { logError } from "@portfolio/api/logging";
import type { GithubCommitPage, GithubContributionCalendar } from "@portfolio/api/types";

import type { GithubLoadResult } from "@/components/portfolio/github-contributions-view";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "@/i18n/server";
import { serverClient } from "@/lib/api-server";

async function getErrorMessage(response: Pick<Response, "body">, fallback: string) {
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

export async function getGithubData({
  locale,
  year,
  page,
  pageSize,
  repo,
}: {
  locale: Locale;
  year: string;
  page: string;
  pageSize: string;
  repo: string;
}) {
  const t = await getTranslations({ locale, namespace: "Github" });
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

  return { contributions, commitHistory, year, page, pageSize, repo };
}
