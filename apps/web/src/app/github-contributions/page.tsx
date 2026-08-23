import type { GithubCommitPage, GithubContributionCalendar } from "@portfolio/api/types";
import type { Metadata } from "next";

import {
  GithubCommitHistorySection,
  GithubContributionCalendarSection,
  type GithubLoadResult,
} from "@/components/portfolio/github-contributions-view";
import { PageHeader } from "@/components/portfolio/page-header";
import { serverClient } from "@/lib/api-server";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "GitHub Contributions",
  description: "GitHub contribution activity and commit history across owned repositories.",
  path: "/github-contributions",
});

type GithubContributionsPageProps = {
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
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

async function loadContributions(
  year: string | undefined,
): Promise<GithubLoadResult<GithubContributionCalendar>> {
  try {
    const response = await serverClient.api.github.contributions.$get({
      query: year ? { year } : {},
    });
    if (!response.ok) {
      return {
        data: null,
        error: await getErrorMessage(response, "GitHub activity could not be loaded."),
      };
    }
    return { data: await response.json(), error: null };
  } catch {
    return { data: null, error: "GitHub activity could not be loaded." };
  }
}

async function loadCommits(filters: {
  page?: string;
  pageSize?: string;
  repo?: string;
}): Promise<GithubLoadResult<GithubCommitPage>> {
  try {
    const response = await serverClient.api.github.commits.$get({ query: filters });
    if (!response.ok) {
      return {
        data: null,
        error: await getErrorMessage(response, "GitHub commit history could not be loaded."),
      };
    }
    return { data: await response.json(), error: null };
  } catch {
    return { data: null, error: "GitHub commit history could not be loaded." };
  }
}

export default async function GithubContributionsPage({
  searchParams,
}: GithubContributionsPageProps) {
  const raw = await searchParams;
  const year = first(raw.year) ?? "";
  const repo = first(raw.repo) ?? "";
  const page = first(raw.page) ?? "";
  const pageSize = first(raw.pageSize) ?? "";
  const [contributions, commitHistory] = await Promise.all([
    loadContributions(year || undefined),
    loadCommits({
      ...(page ? { page } : {}),
      ...(pageSize ? { pageSize } : {}),
      ...(repo ? { repo } : {}),
    }),
  ]);

  return (
    <>
      <PageHeader
        index="04"
        eyebrow="GitHub Contributions"
        title="Contribution activity and commits across repositories I own."
      />
      <GithubContributionCalendarSection initialResult={contributions} initialYear={year} />
      <GithubCommitHistorySection
        initialResult={commitHistory}
        initialFilters={{ page, pageSize, repo }}
      />
    </>
  );
}
