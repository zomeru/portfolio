"use client";

import type { GithubCommitPage, GithubContributionCalendar } from "@portfolio/api/types";
import { ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ContributionCalendar } from "@/components/portfolio/contribution-calendar";
import { Select, type SelectOption } from "@/components/ui/select";
import { client } from "@/lib/api";

const PAGE_SIZES = [10, 20, 50, 100] as const;

export type GithubLoadResult<T> = { data: T; error: null } | { data: null; error: string };

type CalendarSectionProps = {
  initialResult: GithubLoadResult<GithubContributionCalendar>;
  initialYear: string;
};

type CommitSectionProps = {
  initialFilters: {
    page: string;
    pageSize: string;
    repo: string;
  };
  initialResult: GithubLoadResult<GithubCommitPage>;
};

type CommitFilters = {
  page: number;
  pageSize: number;
  repo: string;
};

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function updateLocation(updates: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(updates)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  const query = url.searchParams.toString();
  window.history.pushState(null, "", `${url.pathname}${query ? `?${query}` : ""}${url.hash}`);
}

function readCommitFilters(): CommitFilters {
  const params = new URLSearchParams(window.location.search);
  return {
    page: parsePage(params.get("page") ?? ""),
    pageSize: parsePageSize(params.get("pageSize") ?? ""),
    repo: params.get("repo") ?? "",
  };
}

function parsePage(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parsePageSize(value: string) {
  const parsed = Number.parseInt(value, 10);
  return PAGE_SIZES.includes(parsed as (typeof PAGE_SIZES)[number]) ? parsed : 10;
}

function formatPhtDateTime(value: string) {
  const formatted = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
    month: "long",
    timeZone: "Asia/Manila",
    year: "numeric",
  }).format(new Date(value));
  return `${formatted} PHT`;
}

function ErrorState({ message }: { message: string }) {
  return (
    <p role="alert" className="py-8 text-sm text-muted">
      {message}
    </p>
  );
}

export function GithubContributionCalendarSection({
  initialResult,
  initialYear,
}: CalendarSectionProps) {
  const normalizedInitialYear = initialResult.data?.year
    ? String(initialResult.data.year)
    : initialYear;
  const [result, setResult] = useState(initialResult);
  const [selectedYear, setSelectedYear] = useState(normalizedInitialYear);
  const [pending, setPending] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const yearRef = useRef(normalizedInitialYear);
  yearRef.current = selectedYear;

  const loadCalendar = useCallback(async (year: string) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setPending(true);

    try {
      const response = await client.api.github.contributions.$get(
        { query: year ? { year } : {} },
        { init: { signal: controller.signal } },
      );
      if (!response.ok) {
        const error = await getErrorMessage(
          response as Response,
          "GitHub activity could not be loaded.",
        );
        setResult({ data: null, error });
        return;
      }
      setResult({ data: await response.json(), error: null });
    } catch (error) {
      if (!isAbortError(error)) {
        setResult({ data: null, error: "GitHub activity could not be loaded." });
      }
    } finally {
      if (requestRef.current === controller) setPending(false);
    }
  }, []);

  useEffect(() => {
    function handlePopState() {
      const nextYear = new URLSearchParams(window.location.search).get("year") ?? "";
      if (nextYear === yearRef.current) return;
      setSelectedYear(nextYear);
      void loadCalendar(nextYear);
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      requestRef.current?.abort();
    };
  }, [loadCalendar]);

  function changeYear(year: string) {
    if (year === selectedYear) return;
    setSelectedYear(year);
    updateLocation({ year: year || null });
    void loadCalendar(year);
  }

  const years = new Set(result.data?.availableYears ?? []);
  if (selectedYear) years.add(Number.parseInt(selectedYear, 10));
  const options: SelectOption[] = [
    { label: "Last 12 months", value: "" },
    ...Array.from(years)
      .filter(Number.isSafeInteger)
      .sort((a, b) => b - a)
      .map((year) => ({ label: String(year), value: String(year) })),
  ];

  return (
    <section aria-labelledby="contribution-calendar-heading" className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="contribution-calendar-heading" className="text-base font-medium tracking-tight">
            Contribution calendar
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            GitHub profile contributions, including more than just Git commits.
          </p>
        </div>
        <Select
          id="contribution-year"
          label="Period"
          value={selectedYear}
          options={options}
          onValueChangeAction={changeYear}
          className="w-44"
        />
      </div>
      <div aria-busy={pending} className="mt-6 border-t border-border pt-6">
        <p role="status" className="sr-only">
          {pending ? "Updating contribution calendar." : "Contribution calendar updated."}
        </p>
        {result.data ? (
          <ContributionCalendar calendar={result.data} />
        ) : (
          <ErrorState message={result.error} />
        )}
      </div>
    </section>
  );
}

export function GithubCommitHistorySection({ initialFilters, initialResult }: CommitSectionProps) {
  const initialData = initialResult.data;
  const [result, setResult] = useState(initialResult);
  const [filters, setFilters] = useState<CommitFilters>({
    page: initialData?.page ?? parsePage(initialFilters.page),
    pageSize: initialData?.pageSize ?? parsePageSize(initialFilters.pageSize),
    repo: initialData?.selectedRepository ?? initialFilters.repo,
  });
  const [pending, setPending] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadCommits = useCallback(async (nextFilters: CommitFilters) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setPending(true);

    try {
      const response = await client.api.github.commits.$get(
        {
          query: {
            ...(nextFilters.page > 1 ? { page: String(nextFilters.page) } : {}),
            ...(nextFilters.pageSize !== 10 ? { pageSize: String(nextFilters.pageSize) } : {}),
            ...(nextFilters.repo ? { repo: nextFilters.repo } : {}),
          },
        },
        { init: { signal: controller.signal } },
      );
      if (!response.ok) {
        const error = await getErrorMessage(
          response as Response,
          "GitHub commit history could not be loaded.",
        );
        setResult({ data: null, error });
        return;
      }
      const data = await response.json();
      setResult({ data, error: null });
      setFilters({
        page: data.page,
        pageSize: data.pageSize,
        repo: data.selectedRepository ?? "",
      });
    } catch (error) {
      if (!isAbortError(error)) {
        setResult({ data: null, error: "GitHub commit history could not be loaded." });
      }
    } finally {
      if (requestRef.current === controller) setPending(false);
    }
  }, []);

  useEffect(() => {
    function handlePopState() {
      const nextFilters = readCommitFilters();
      const current = filtersRef.current;
      if (
        nextFilters.page === current.page &&
        nextFilters.pageSize === current.pageSize &&
        nextFilters.repo === current.repo
      ) {
        return;
      }
      setFilters(nextFilters);
      void loadCommits(nextFilters);
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      requestRef.current?.abort();
    };
  }, [loadCommits]);

  function changeFilters(nextFilters: CommitFilters) {
    setFilters(nextFilters);
    updateLocation({
      page: nextFilters.page > 1 ? String(nextFilters.page) : null,
      pageSize: nextFilters.pageSize !== 10 ? String(nextFilters.pageSize) : null,
      repo: nextFilters.repo || null,
    });
    void loadCommits(nextFilters);
  }

  const repositoryOptions: SelectOption[] = [
    { label: "All repositories", value: "" },
    ...(result.data?.repositories.map((repository) => ({
      label: repository.label,
      value: repository.value,
    })) ?? []),
  ];
  if (filters.repo && !repositoryOptions.some((option) => option.value === filters.repo)) {
    repositoryOptions.push({ label: filters.repo, value: filters.repo });
  }
  const pageSizeOptions = PAGE_SIZES.map((size) => ({ label: String(size), value: String(size) }));

  return (
    <section aria-labelledby="commit-history-heading" className="mt-16">
      <div>
        <h2 id="commit-history-heading" className="text-base font-medium tracking-tight">
          Commit history
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Authored commits on the default branches of owned repositories, newest first.
        </p>
      </div>

      <div className="mt-6 grid gap-3 border-t border-border pt-6 sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-end">
        <Select
          id="commit-repository"
          label="Repository"
          value={filters.repo}
          options={repositoryOptions}
          onValueChangeAction={(repo) => changeFilters({ ...filters, page: 1, repo })}
        />
        <Select
          id="commit-page-size"
          label="Per page"
          value={String(filters.pageSize)}
          options={pageSizeOptions}
          onValueChangeAction={(pageSize) =>
            changeFilters({ ...filters, page: 1, pageSize: Number.parseInt(pageSize, 10) })
          }
        />
      </div>

      <div aria-busy={pending}>
        <p role="status" className="sr-only">
          {pending ? "Updating commit history." : "Commit history updated."}
        </p>
        {result.data ? (
          <>
            {result.data.commits.length > 0 ? (
              <ul className="mt-6 divide-y divide-border border-t border-border">
                {result.data.commits.map((commit) => (
                  <li key={`${commit.repository}-${commit.sha}-${commit.committedAt}`}>
                    <article className="py-5 sm:py-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="font-mono text-xs text-muted">
                          {commit.repository} · {commit.sha}
                        </p>
                        <time
                          dateTime={commit.committedAt}
                          className="font-mono text-xs text-muted"
                        >
                          {formatPhtDateTime(commit.committedAt)}
                        </time>
                      </div>
                      <p className="mt-2 break-words text-sm leading-relaxed">{commit.message}</p>
                      {commit.url && (
                        <a
                          href={commit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-sm underline-offset-4 transition-colors duration-200 hover:text-muted motion-reduce:transition-none"
                        >
                          View commit
                          <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      )}
                    </article>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t border-border py-8 text-sm text-muted">
                No matching commits were found.
              </p>
            )}

            {(result.data.truncated || result.data.incompleteResults) && (
              <p className="mt-5 text-xs leading-relaxed text-muted">
                GitHub limits commit-search results to the first 1,000 matches and may report an
                incomplete result set.
              </p>
            )}

            {result.data.totalPages > 1 && (
              <nav
                aria-label="Commit history pagination"
                className="mt-8 flex items-center justify-between gap-4 text-sm"
              >
                <button
                  type="button"
                  disabled={pending || result.data.page <= 1}
                  onClick={() => changeFilters({ ...filters, page: result.data.page - 1 })}
                  className="inline-flex min-h-6 items-center underline-offset-4 transition-colors duration-200 enabled:hover:text-muted disabled:text-muted motion-reduce:transition-none"
                >
                  ← Newer
                </button>
                <p className="font-mono text-xs text-muted">
                  Page {result.data.page} of {result.data.totalPages}
                </p>
                <button
                  type="button"
                  disabled={pending || result.data.page >= result.data.totalPages}
                  onClick={() => changeFilters({ ...filters, page: result.data.page + 1 })}
                  className="inline-flex min-h-6 items-center underline-offset-4 transition-colors duration-200 enabled:hover:text-muted disabled:text-muted motion-reduce:transition-none"
                >
                  Older →
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="mt-6 border-t border-border">
            <ErrorState message={result.error} />
          </div>
        )}
      </div>
    </section>
  );
}
