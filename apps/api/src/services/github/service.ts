import { getGithubServerEnv } from "@portfolio/env/github-server";

import { ApiError } from "../../errors";
import type {
  GithubCommit,
  GithubCommitPage,
  GithubContributionCalendar,
  GithubContributionLevel,
  GithubRepositoryOption,
} from "../../types";

const GITHUB_API_ORIGIN = "https://api.github.com";
const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const GITHUB_API_VERSION = "2022-11-28";
const MAX_SEARCH_RESULTS = 1_000;
const CACHE_LIMIT = 160;
const CACHE_TTL = {
  commits: 5 * 60 * 1_000,
  contributions: 60 * 60 * 1_000,
  repositories: 10 * 60 * 1_000,
  viewer: 60 * 60 * 1_000,
} as const;

type CacheEntry = {
  expiresAt: number;
  promise: Promise<unknown>;
};

type GithubViewer = {
  login: string;
};

type OwnedRepository = {
  fullName: string;
  id: number;
  isPrivate: boolean;
  label: string;
  name: string;
  value: string;
};

type RestRepository = {
  full_name: string;
  id: number;
  name: string;
  owner: { login: string };
  private: boolean;
};

type CommitSearchItem = {
  author: { login: string } | null;
  commit: {
    author: { date: string } | null;
    message: string;
  };
  html_url: string;
  repository: RestRepository;
  sha: string;
};

type CommitSearchResponse = {
  incomplete_results: boolean;
  items: CommitSearchItem[];
  total_count: number;
};

type ContributionGraphqlResponse = {
  viewer: {
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: number;
        weeks: Array<{
          contributionDays: Array<{
            contributionCount: number;
            contributionLevel: GithubContributionLevel;
            date: string;
            weekday: number;
          }>;
          firstDay: string;
        }>;
      };
      contributionYears: number[];
      endedAt: string;
      startedAt: string;
    };
  };
};

type GraphqlEnvelope<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

const cache = new Map<string, CacheEntry>();

async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const current = cache.get(key);
  if (current && current.expiresAt > Date.now()) {
    return current.promise as Promise<T>;
  }

  const promise = load();
  cache.set(key, { expiresAt: Date.now() + ttl, promise });

  if (cache.size > CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }

  try {
    return await promise;
  } catch (error) {
    if (cache.get(key)?.promise === promise) cache.delete(key);
    throw error;
  }
}

function getToken() {
  try {
    return getGithubServerEnv().token;
  } catch (cause) {
    throw new ApiError("GitHub activity is not configured.", {
      cause,
      code: "GITHUB_CONFIGURATION_ERROR",
      status: 503,
    });
  }
}

async function githubFetch(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/vnd.github+json");
  headers.set("Authorization", `Bearer ${getToken()}`);
  headers.set("User-Agent", "portfolio-github-contributions");
  headers.set("X-GitHub-Api-Version", GITHUB_API_VERSION);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (cause) {
    throw new ApiError("GitHub is temporarily unavailable.", {
      cause,
      code: "GITHUB_REQUEST_FAILED",
      status: 502,
    });
  }

  if (response.ok) return response;

  const isRateLimited =
    response.status === 429 ||
    (response.status === 403 &&
      (response.headers.get("x-ratelimit-remaining") === "0" ||
        response.headers.has("retry-after")));

  if (isRateLimited) {
    throw new ApiError("GitHub's rate limit was reached. Please try again later.", {
      code: "GITHUB_RATE_LIMITED",
      status: 429,
    });
  }

  const isConfigurationError = response.status === 401 || response.status === 403;
  throw new ApiError(
    isConfigurationError
      ? "GitHub activity is not configured correctly."
      : "GitHub is temporarily unavailable.",
    {
      code: isConfigurationError ? "GITHUB_CONFIGURATION_ERROR" : "GITHUB_REQUEST_FAILED",
      status: isConfigurationError ? 503 : 502,
    },
  );
}

async function githubRest<T>(path: string): Promise<T> {
  const response = await githubFetch(new URL(path, GITHUB_API_ORIGIN).href);
  return (await response.json()) as T;
}

async function githubGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await githubFetch(GITHUB_GRAPHQL_URL, {
    body: JSON.stringify({ query, variables }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const envelope = (await response.json()) as GraphqlEnvelope<T>;

  if (envelope.errors?.length || !envelope.data) {
    const rateLimited = envelope.errors?.some((error) =>
      error.message?.toLowerCase().includes("rate limit"),
    );
    throw new ApiError(
      rateLimited
        ? "GitHub's rate limit was reached. Please try again later."
        : "GitHub is temporarily unavailable.",
      {
        code: rateLimited ? "GITHUB_RATE_LIMITED" : "GITHUB_REQUEST_FAILED",
        status: rateLimited ? 429 : 502,
      },
    );
  }

  return envelope.data;
}

async function getViewer(): Promise<GithubViewer> {
  return cached("github:viewer", CACHE_TTL.viewer, () => githubRest<GithubViewer>("/user"));
}

async function getOwnedRepositories(): Promise<OwnedRepository[]> {
  return cached("github:repositories", CACHE_TTL.repositories, async () => {
    const viewer = await getViewer();
    const repositories: RestRepository[] = [];

    for (let page = 1; ; page += 1) {
      const search = new URLSearchParams({
        affiliation: "owner",
        direction: "desc",
        page: String(page),
        per_page: "100",
        sort: "pushed",
        visibility: "all",
      });
      const result = await githubRest<RestRepository[]>(`/user/repos?${search}`);
      repositories.push(...result);
      if (result.length < 100) break;
    }

    let privateIndex = 0;
    return repositories
      .filter((repository) => repository.owner.login.toLowerCase() === viewer.login.toLowerCase())
      .map((repository) => {
        if (repository.private) privateIndex += 1;
        return {
          fullName: repository.full_name,
          id: repository.id,
          isPrivate: repository.private,
          label: repository.private ? `Private repository ${privateIndex}` : repository.name,
          name: repository.name,
          value: repository.private ? `private:${repository.id}` : repository.name,
        };
      });
  });
}

function contributionRange(year: number | undefined) {
  if (year === undefined) return { from: null, to: null };

  return {
    from: new Date(Date.UTC(year, 0, 1)).toISOString(),
    to: new Date(Date.UTC(year, 11, 31, 23, 59, 59)).toISOString(),
  };
}

export async function getGithubContributionCalendar(
  year?: number,
): Promise<GithubContributionCalendar> {
  const range = contributionRange(year);
  return cached(`github:contributions:${year ?? "recent"}`, CACHE_TTL.contributions, async () => {
    const data = await githubGraphql<ContributionGraphqlResponse>(
      `query PortfolioContributions($from: DateTime, $to: DateTime) {
        viewer {
          contributionsCollection(from: $from, to: $to) {
            contributionYears
            startedAt
            endedAt
            contributionCalendar {
              totalContributions
              weeks {
                firstDay
                contributionDays {
                  contributionCount
                  contributionLevel
                  date
                  weekday
                }
              }
            }
          }
        }
      }`,
      range,
    );
    const collection = data.viewer.contributionsCollection;

    return {
      availableYears: collection.contributionYears
        .filter(Number.isSafeInteger)
        .sort((left, right) => right - left),
      from: collection.startedAt,
      to: collection.endedAt,
      totalContributions: collection.contributionCalendar.totalContributions,
      weeks: collection.contributionCalendar.weeks,
      year: year ?? null,
    };
  });
}

function repositoryOptions(repositories: OwnedRepository[]): GithubRepositoryOption[] {
  return repositories.map(({ isPrivate, label, value }) => ({ isPrivate, label, value }));
}

function getPublicCommitUrl(url: string, repository: RestRepository, sha: string) {
  try {
    const parsed = new URL(url);
    const expectedPath = `/${repository.full_name}/commit/${sha}`.toLowerCase();
    return parsed.protocol === "https:" &&
      parsed.hostname === "github.com" &&
      parsed.pathname.toLowerCase() === expectedPath
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

function sanitizeCommit(
  item: CommitSearchItem,
  repository: OwnedRepository,
  viewer: GithubViewer,
): GithubCommit | null {
  if (item.author?.login.toLowerCase() !== viewer.login.toLowerCase()) return null;
  const committedAt = item.commit.author?.date;
  if (!committedAt) return null;

  const isPrivate = repository.isPrivate || item.repository.private;
  const publicMessage = item.commit.message.split(/\r?\n/, 1)[0]?.trim();

  return {
    committedAt,
    message: isPrivate ? "Private commit" : publicMessage || "Untitled commit",
    repository: isPrivate ? "Private repository" : repository.name,
    repositoryIsPrivate: isPrivate,
    sha: item.sha.slice(0, 7),
    url: isPrivate ? null : getPublicCommitUrl(item.html_url, item.repository, item.sha),
  };
}

async function searchCommits(query: string, page: number, pageSize: number) {
  const search = new URLSearchParams({
    order: "desc",
    page: String(page),
    per_page: String(pageSize),
    q: query,
    sort: "author-date",
  });
  return cached(`github:commits:${search}`, CACHE_TTL.commits, () =>
    githubRest<CommitSearchResponse>(`/search/commits?${search}`),
  );
}

export async function getGithubCommits(input: {
  page: number;
  pageSize: 10 | 20 | 50 | 100;
  repository?: string;
}): Promise<GithubCommitPage> {
  const [viewer, repositories] = await Promise.all([getViewer(), getOwnedRepositories()]);
  const selected = repositories.find((repository) => repository.value === input.repository);
  const maximumPage = Math.max(1, Math.floor(MAX_SEARCH_RESULTS / input.pageSize));
  let page = Math.min(Math.max(1, input.page), maximumPage);
  const qualifier = selected ? `repo:${selected.fullName}` : `user:${viewer.login}`;
  const query = `author:${viewer.login} ${qualifier}`;
  let result = await searchCommits(query, page, input.pageSize);
  const total = Math.min(MAX_SEARCH_RESULTS, result.total_count);
  const totalPages = Math.max(1, Math.ceil(total / input.pageSize));

  if (total > 0 && page > totalPages) {
    page = totalPages;
    result = await searchCommits(query, page, input.pageSize);
  }

  const repositoryByFullName = new Map(
    repositories.map((repository) => [repository.fullName.toLowerCase(), repository]),
  );
  const commits = result.items.flatMap((item) => {
    if (item.repository.owner.login.toLowerCase() !== viewer.login.toLowerCase()) return [];
    const repository = repositoryByFullName.get(item.repository.full_name.toLowerCase());
    if (!repository) return [];
    const commit = sanitizeCommit(item, repository, viewer);
    return commit ? [commit] : [];
  });

  return {
    commits,
    incompleteResults: result.incomplete_results,
    page,
    pageSize: input.pageSize,
    repositories: repositoryOptions(repositories),
    selectedRepository: selected?.value ?? null,
    total,
    totalPages,
    truncated: result.total_count > MAX_SEARCH_RESULTS,
  };
}
