import type { Locale } from "@/i18n/routing";

const searchGroupOrder = [
  "page",
  "work",
  "project",
  "blog",
  "profile",
  "action",
  "assistant",
] as const;

export type SearchGroup = (typeof searchGroupOrder)[number];

export type SearchIndexStatus = "loading" | "ready" | "error";

type SearchAction =
  | { kind: "book-call" }
  | { kind: "switch-locale"; locale: Locale }
  | { kind: "toggle-theme" };

export type SearchItem = {
  action?: SearchAction;
  aliases: string[];
  description?: string;
  external?: boolean;
  group: SearchGroup;
  href?: string;
  id: string;
  keywords: string[];
  machineRoute?: boolean;
  title: string;
};

export type RankedSearchItem = SearchItem & { score: number };
