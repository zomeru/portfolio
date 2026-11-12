import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useTranslations } from "use-intl";
import { z } from "zod";

import { PageTransition } from "@/components/layout/page-transition";
import GithubContributionsLoading from "@/components/portfolio/github-contributions-loading";
import {
  GithubCommitHistorySection,
  GithubContributionCalendarSection,
} from "@/components/portfolio/github-contributions-view";
import { PageHeader } from "@/components/portfolio/page-header";
import { translatedHead } from "@/lib/localized-head";

const queryString = z.string().max(256);

const getGithub = createServerFn({ method: "GET" })
  .validator(
    z.object({
      locale: z.enum(["en", "ja", "zh-CN", "de"]),
      year: queryString,
      page: queryString,
      pageSize: queryString,
      repo: queryString,
    }),
  )
  .handler(async ({ data }) => (await import("@/lib/github.server")).getGithubData(data));

function queryValue(value: unknown) {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" || typeof first === "number"
    ? String(first).slice(0, 256)
    : undefined;
}

export const Route = createFileRoute("/{-$locale}/github-contributions")({
  validateSearch: ({ year, page, pageSize, repo }: Record<string, unknown>) => ({
    year: queryValue(year),
    page: queryValue(page),
    pageSize: queryValue(pageSize),
    repo: queryValue(repo),
  }),
  loaderDeps: ({ search }) => ({
    year: search.year ?? "",
    page: search.page ?? "",
    pageSize: search.pageSize ?? "",
    repo: search.repo ?? "",
  }),
  loader: ({ context, deps }) => getGithub({ data: { ...deps, locale: context.locale } }),
  head: (input) =>
    translatedHead(input, "github", "/github-contributions", {
      imagePath: "/github-contributions/opengraph-image",
    }),
  pendingComponent: GithubContributionsLoading,
  component: GithubContributionsPage,
});

function GithubContributionsPage() {
  const t = useTranslations("Github");
  const { contributions, commitHistory, year, page, pageSize, repo } = Route.useLoaderData();
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
