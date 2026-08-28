import type { UIMessage } from "ai";

import type { apiApp } from "./app";

export type AppType = typeof apiApp;

export type QueryIntent =
  | "general"
  | "profile"
  | "experience"
  | "project"
  | "blog"
  | "portfolio"
  | "navigation"
  | "techstack";

export type GithubContributionLevel =
  | "NONE"
  | "FIRST_QUARTILE"
  | "SECOND_QUARTILE"
  | "THIRD_QUARTILE"
  | "FOURTH_QUARTILE";

export type GithubContributionDay = {
  date: string;
  contributionCount: number;
  contributionLevel: GithubContributionLevel;
  weekday: number;
};

export type GithubContributionWeek = {
  firstDay: string;
  contributionDays: GithubContributionDay[];
};

export type GithubContributionCalendar = {
  availableYears: number[];
  from: string;
  to: string;
  totalContributions: number;
  weeks: GithubContributionWeek[];
  year: number | null;
};

export type GithubRepositoryOption = {
  isPrivate: boolean;
  label: string;
  value: string;
};

export type GithubCommit = {
  committedAt: string;
  message: string;
  repository: string;
  repositoryIsPrivate: boolean;
  sha: string;
  url: string | null;
};

export type GithubCommitPage = {
  commits: GithubCommit[];
  incompleteResults: boolean;
  page: number;
  pageSize: 10 | 20 | 50 | 100;
  repositories: GithubRepositoryOption[];
  selectedRepository: string | null;
  total: number;
  totalPages: number;
  truncated: boolean;
};

export type KnowledgeSourceType = "profile" | "experience" | "project" | "blog" | "techstack";

export type AskZomerSourceType = KnowledgeSourceType | "web";

export type AskZomerSource = {
  id: string;
  title: string;
  url: string;
  sourceType: AskZomerSourceType;
};

export type AskZomerMessageMetadata = {
  createdAt: string;
  intent?: QueryIntent;
  model?: string;
  sources?: AskZomerSource[];
  suggestions?: string[];
  webSearch?: boolean;
};

export type AskZomerMessage = UIMessage<AskZomerMessageMetadata>;

export type AskZomerHistoryPage = {
  messages: AskZomerMessage[];
  nextCursor: string | null;
};

export type AdminErrorSeverity = "error" | "warning";
export type AdminErrorStatus = "open" | "resolved" | "ignored";

export type AdminErrorIssueSummary = {
  id: string;
  severity: AdminErrorSeverity;
  name: string;
  message: string;
  source: string | null;
  route: string | null;
  service: string;
  errorCode: string | null;
  status: AdminErrorStatus;
  occurrenceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type AdminErrorIssuePage = {
  issues: AdminErrorIssueSummary[];
  nextCursor: string | null;
};

export type AdminErrorDetail = AdminErrorIssueSummary & {
  fingerprint: string;
  stack: string | null;
  method: string | null;
  requestId: string | null;
  userAgent: string | null;
  environment: string;
  metadata: Record<string, unknown>;
  cause: Record<string, unknown> | null;
  resolvedAt: string | null;
};

export const INITIAL_ASK_ZOMER_SUGGESTIONS = [
  "What's Zomer's experience?",
  "What projects has he built?",
  "What's his backend experience?",
  "What technologies does he use?",
  "What has he written about?",
] as const;
