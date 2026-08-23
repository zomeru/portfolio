import { Hono } from "hono";

import { getGithubCommits, getGithubContributionCalendar } from "../services/github/service";
import type { ApiEnv } from "../types/hono";

type PageSize = 10 | 20 | 50 | 100;
const PAGE_SIZES = new Set<PageSize>([10, 20, 50, 100] as const);

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePageSize(value: string | undefined): PageSize {
  const parsed = Number.parseInt(value ?? "", 10);
  return PAGE_SIZES.has(parsed as PageSize) ? (parsed as PageSize) : 10;
}

function parseYear(value: string | undefined) {
  const year = Number.parseInt(value ?? "", 10);
  const currentYear = new Date().getUTCFullYear();
  return Number.isSafeInteger(year) && year >= 2008 && year <= currentYear ? year : undefined;
}

function parseRepository(value: string | undefined) {
  const repository = value?.trim();
  return repository && repository.length <= 160 ? repository : undefined;
}

export const githubRoutes = new Hono<ApiEnv>()
  .get("/contributions", async (c) => {
    const contributions = await getGithubContributionCalendar(parseYear(c.req.query("year")));
    c.header("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return c.json(contributions);
  })
  .get("/commits", async (c) => {
    const repository = parseRepository(c.req.query("repo"));
    const commits = await getGithubCommits({
      page: parsePositiveInteger(c.req.query("page"), 1),
      pageSize: parsePageSize(c.req.query("pageSize")),
      ...(repository ? { repository } : {}),
    });
    c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    return c.json(commits);
  });
