import { createHash } from "node:crypto";

import {
  countBlogDocumentsMatchingTerms,
  countDistinctExperienceCompanies,
  countKnowledgeDocumentsBySource,
  createRetrievalEvent,
  findBlogCandidatesMatchingTerms,
  findExperienceOverviewCandidates,
  findKeywordKnowledgeCandidates,
  findLatestKnowledgeCandidates,
  findOldestBlogCandidates,
  findOldestKnowledgeCandidates,
  findRecentKnowledgeCandidates,
  findSemanticKnowledgeCandidates,
  type KnowledgeCandidate,
  type RetrievalResultMetadata,
} from "@portfolio/database";

import { errorLogMetadata, log } from "../../lib/log";
import type { AskZomerSource, KnowledgeSourceType } from "../../types";
import { getAssistantModels } from "../ai/models";
import {
  ASSISTANT_INDEX_VERSION,
  RECENT_BLOG_DEFAULT_RESULT_LIMIT,
  RECENT_BLOG_MAX_RESULT_LIMIT,
  RETRIEVAL_CANDIDATE_LIMIT,
  RETRIEVAL_CONTEXT_TOKEN_BUDGET,
  RETRIEVAL_RESULT_LIMIT,
} from "./config";
import { embedQuery } from "./embeddings";
import type { IntentClassification, RetrievalQuery, RetrievedKnowledge } from "./types";

const RRF_K = 60;
const RECENCY_QUERY = /\b(latest|most recent|newest|current|recent|last)\b/i;
const OLDEST_QUERY = /\b(oldest|oldes|earliest|first)\b/i;
const BLOG_COUNT_QUERY =
  /(?:\bhow\s+(?:(?:many|much)\s+)?(?:blogs?|articles?|posts?|entries)\b|\b(?:number of|count of|total(?: number)? of)\b.{0,60}\b(?:blogs?|articles?|posts?|entries)\b)/i;
const COMPANY_COUNT_QUERY =
  /(?:\bhow\s+(?:(?:many|much)\s+)?(?:companies|organizations|organisations|employers)\b|\b(?:number of|count of|total(?: number)? of)\b.{0,60}\b(?:companies|organizations|organisations|employers)\b)/i;
const BLOG_TERM_LIST_QUERY =
  /(?:\b(?:which|what|list|show|find)\b.{0,80}\b(?:blogs?|articles?|posts?)\b|\b(?:blogs?|articles?|posts?)\b.{0,80}\b(?:mention|mentions|cover|covers|about|using|use|with)\b)/i;
const PLURAL_CONTENT_QUERY = /\b(blogs|articles|posts|entries|writings)\b/i;
const ALL_RESULTS_QUERY = /\ball\b/i;
const COUNT_WORDS: Readonly<Record<string, number>> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};
const COUNT_WORD_QUERY = new RegExp(`\\b(${Object.keys(COUNT_WORDS).join("|")})\\b`, "i");
const BROAD_EXPERIENCE_WORDS = new Set([
  "a",
  "about",
  "all",
  "an",
  "and",
  "are",
  "as",
  "at",
  "background",
  "can",
  "career",
  "companies",
  "company",
  "developer",
  "does",
  "experience",
  "experiences",
  "give",
  "has",
  "have",
  "he",
  "his",
  "history",
  "is",
  "job",
  "jobs",
  "just",
  "me",
  "my",
  "of",
  "overall",
  "overview",
  "please",
  "professional",
  "professionally",
  "resume",
  "role",
  "roles",
  "s",
  "software",
  "summary",
  "summarise",
  "summarize",
  "tell",
  "the",
  "what",
  "whats",
  "where",
  "work",
  "worked",
  "working",
  "you",
  "your",
  "zomer",
  "zomers",
]);

type CandidateRow = KnowledgeCandidate;
type IndexIdentity = { embeddingModel: string; indexVersion: string };
type StructuredStrategy =
  | "blog-filter-list"
  | "blog-count"
  | "latest-blog"
  | "oldest-blog"
  | "oldest-blogs"
  | "recent-blogs"
  | "company-count"
  | "latest-experience"
  | "oldest-experience"
  | "experience-overview";

function sourceBoost(sourceType: KnowledgeSourceType, intent: IntentClassification["intent"]) {
  if (intent === "blog") return sourceType === "blog" ? 0.003 : -0.001;
  if (intent === "project") return sourceType === "project" ? 0.002 : 0;
  if (intent === "experience") return sourceType === "experience" ? 0.002 : 0;
  if (intent === "techstack") return sourceType === "techstack" ? 0.003 : 0.001;
  if (intent === "profile" || intent === "navigation") {
    return sourceType === "profile" ? 0.002 : 0;
  }
  return sourceType === "blog" ? -0.001 : 0.001;
}

async function semanticCandidates(
  query: string,
  sourceTypes: KnowledgeSourceType[],
  identity: IndexIdentity,
) {
  const embedding = await embedQuery(query);
  return findSemanticKnowledgeCandidates({
    ...identity,
    embedding,
    sourceTypes,
    limit: RETRIEVAL_CANDIDATE_LIMIT,
  });
}

async function keywordCandidates(
  query: string,
  sourceTypes: KnowledgeSourceType[],
  identity: IndexIdentity,
) {
  return findKeywordKnowledgeCandidates({
    ...identity,
    query,
    sourceTypes,
    limit: RETRIEVAL_CANDIDATE_LIMIT,
  });
}

function fuseCandidates(
  semantic: readonly CandidateRow[],
  keyword: readonly CandidateRow[],
  intent: IntentClassification["intent"],
) {
  const fused = new Map<string, RetrievedKnowledge>();

  const add = (candidate: CandidateRow, rank: number, mode: "semantic" | "keyword") => {
    const existing = fused.get(candidate.chunkId) ?? {
      ...candidate,
      score: sourceBoost(candidate.sourceType, intent),
    };
    if (mode === "semantic") {
      existing.semanticRank = rank;
      existing.score += 0.58 / (RRF_K + rank);
    } else {
      existing.keywordRank = rank;
      existing.score += 0.42 / (RRF_K + rank);
    }
    fused.set(candidate.chunkId, existing);
  };

  semantic.forEach((candidate, index) => {
    add(candidate, index + 1, "semantic");
  });
  keyword.forEach((candidate, index) => {
    add(candidate, index + 1, "keyword");
  });

  return [...fused.values()].sort((left, right) => right.score - left.score);
}

function searchableCandidateText(candidate: RetrievedKnowledge) {
  return `${candidate.title}\n${candidate.content}\n${JSON.stringify(candidate.metadata)}`.toLocaleLowerCase();
}

function namedTermCoverage(candidate: RetrievedKnowledge, namedTerms: readonly string[]) {
  const text = searchableCandidateText(candidate);
  return namedTerms.filter((term) => text.includes(term.toLocaleLowerCase())).length;
}

function finalizeCandidates(
  candidates: readonly RetrievedKnowledge[],
  namedTerms: readonly string[],
  maxPerDocument: number,
  resultLimit = RETRIEVAL_RESULT_LIMIT,
) {
  const ranked = [...candidates].sort((left, right) => {
    const coverage = namedTermCoverage(right, namedTerms) - namedTermCoverage(left, namedTerms);
    return coverage || right.score - left.score;
  });
  const documentCounts = new Map<string, number>();
  const contentSignatures = new Set<string>();
  const selected: RetrievedKnowledge[] = [];
  let tokenCount = 0;

  for (const candidate of ranked) {
    if ((documentCounts.get(candidate.documentId) ?? 0) >= maxPerDocument) continue;
    const signature = candidate.content.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
    const shouldDeduplicateContent = !candidate.structuredRank;
    if (shouldDeduplicateContent && contentSignatures.has(signature)) continue;
    if (
      !candidate.structuredRank &&
      selected.length > 0 &&
      tokenCount + candidate.tokenCount > RETRIEVAL_CONTEXT_TOKEN_BUDGET
    ) {
      continue;
    }

    selected.push(candidate);
    tokenCount += candidate.tokenCount;
    documentCounts.set(candidate.documentId, (documentCounts.get(candidate.documentId) ?? 0) + 1);
    if (shouldDeduplicateContent) contentSignatures.add(signature);
    if (selected.length >= resultLimit) break;
  }

  return selected;
}

function sourcesFromKnowledge(results: readonly RetrievedKnowledge[]): AskZomerSource[] {
  const sources = new Map<string, AskZomerSource>();
  for (const result of results) {
    if (sources.has(result.documentId)) continue;
    sources.set(result.documentId, {
      id: result.documentId,
      title: result.title,
      url: result.canonicalUrl,
      sourceType: result.sourceType,
    });
  }
  return [...sources.values()];
}

function chronologicalSourceType(
  options: {
    query: string;
    classification: IntentClassification;
  },
  matcher: RegExp,
): "blog" | "experience" | undefined {
  if (!matcher.test(options.query)) return undefined;
  if (options.classification.intent === "blog") return "blog";
  if (options.classification.intent === "experience") return "experience";
  return undefined;
}

function explicitRecentBlogCount(query: string) {
  if (ALL_RESULTS_QUERY.test(query)) return RECENT_BLOG_MAX_RESULT_LIMIT;
  const numericCount = query.match(/\b([1-9]\d?)\b/)?.[1];
  if (numericCount) return Number(numericCount);
  const wordCount = query.match(COUNT_WORD_QUERY)?.[1]?.toLocaleLowerCase();
  if (wordCount) return COUNT_WORDS[wordCount];
  if (/\b(?:a )?couple(?: of)?\b/i.test(query)) return 2;
  if (/\b(?:a )?few\b/i.test(query)) return 3;
  if (/\bseveral\b/i.test(query)) return 5;
  return undefined;
}

export function recentBlogResultLimit(query: string) {
  const requested = explicitRecentBlogCount(query) ?? RECENT_BLOG_DEFAULT_RESULT_LIMIT;
  return Math.min(RECENT_BLOG_MAX_RESULT_LIMIT, Math.max(1, requested));
}

function wantsRecentBlogList(query: string) {
  return (
    PLURAL_CONTENT_QUERY.test(query) ||
    ALL_RESULTS_QUERY.test(query) ||
    explicitRecentBlogCount(query) !== undefined
  );
}

function isBroadExperienceQuery(options: { query: string; classification: IntentClassification }) {
  if (options.classification.intent !== "experience") return false;
  const meaningfulWords = options.query
    .toLocaleLowerCase()
    .replace(/[’']/g, "")
    .match(/[a-z0-9+#]+/g)
    ?.filter((word) => !BROAD_EXPERIENCE_WORDS.has(word));
  return !meaningfulWords || meaningfulWords.length === 0;
}

export function classifyStructuredRetrieval(options: {
  query: string;
  classification: IntentClassification;
  namedTerms?: readonly string[];
}): StructuredStrategy | null {
  if (options.classification.intent === "blog" && BLOG_COUNT_QUERY.test(options.query)) {
    return "blog-count";
  }
  if (options.classification.intent === "experience" && COMPANY_COUNT_QUERY.test(options.query)) {
    return "company-count";
  }
  const oldestType = chronologicalSourceType(options, OLDEST_QUERY);
  if (oldestType === "blog") {
    return wantsRecentBlogList(options.query) ? "oldest-blogs" : "oldest-blog";
  }
  if (oldestType === "experience") return "oldest-experience";
  const latestType = chronologicalSourceType(options, RECENCY_QUERY);
  if (latestType === "blog") {
    return wantsRecentBlogList(options.query) ? "recent-blogs" : "latest-blog";
  }
  if (latestType === "experience") return "latest-experience";
  if (
    options.classification.intent === "blog" &&
    BLOG_TERM_LIST_QUERY.test(options.query) &&
    options.namedTerms?.length
  ) {
    return "blog-filter-list";
  }
  if (isBroadExperienceQuery(options)) return "experience-overview";
  return null;
}

async function structuredCandidates(
  options: {
    query: string;
    classification: IntentClassification;
    namedTerms: readonly string[];
  },
  identity: IndexIdentity,
) {
  const strategy = classifyStructuredRetrieval(options);
  if (strategy === "blog-count") {
    return {
      aggregate: {
        kind: "blog-count" as const,
        value: await countKnowledgeDocumentsBySource({
          ...identity,
          sourceType: "blog",
        }),
      },
      candidates: [],
      maxPerDocument: 1,
      resultLimit: 0,
      strategy,
    };
  }
  if (strategy === "latest-blog") {
    return {
      aggregate: null,
      candidates: await findLatestKnowledgeCandidates({
        ...identity,
        sourceType: "blog",
        limit: 1,
      }),
      maxPerDocument: 1,
      resultLimit: 1,
      strategy,
    };
  }
  if (strategy === "oldest-blog") {
    return {
      aggregate: null,
      candidates: await findOldestKnowledgeCandidates({
        ...identity,
        sourceType: "blog",
        limit: 1,
      }),
      maxPerDocument: 1,
      resultLimit: 1,
      strategy,
    };
  }
  if (strategy === "oldest-blogs") {
    const resultLimit = recentBlogResultLimit(options.query);
    return {
      aggregate: null,
      candidates: await findOldestBlogCandidates({
        ...identity,
        limit: resultLimit,
      }),
      maxPerDocument: 1,
      resultLimit,
      strategy,
    };
  }
  if (strategy === "recent-blogs") {
    const resultLimit = recentBlogResultLimit(options.query);
    return {
      aggregate: null,
      candidates: await findRecentKnowledgeCandidates({
        ...identity,
        sourceType: "blog",
        limit: resultLimit,
      }),
      maxPerDocument: 1,
      resultLimit,
      strategy,
    };
  }
  if (strategy === "latest-experience") {
    return {
      aggregate: null,
      candidates: await findLatestKnowledgeCandidates({
        ...identity,
        sourceType: "experience",
        limit: 1,
      }),
      maxPerDocument: 1,
      resultLimit: 1,
      strategy,
    };
  }
  if (strategy === "oldest-experience") {
    return {
      aggregate: null,
      candidates: await findOldestKnowledgeCandidates({
        ...identity,
        sourceType: "experience",
        limit: 1,
      }),
      maxPerDocument: 1,
      resultLimit: 1,
      strategy,
    };
  }
  if (strategy === "company-count") {
    return {
      aggregate: {
        kind: "company-count" as const,
        value: await countDistinctExperienceCompanies(identity),
      },
      candidates: [],
      maxPerDocument: 1,
      resultLimit: 0,
      strategy,
    };
  }
  if (strategy === "blog-filter-list") {
    const requestedLimit = explicitRecentBlogCount(options.query) ?? RECENT_BLOG_MAX_RESULT_LIMIT;
    const resultLimit = Math.min(RECENT_BLOG_MAX_RESULT_LIMIT, Math.max(1, requestedLimit));
    const [value, candidates] = await Promise.all([
      countBlogDocumentsMatchingTerms({ ...identity, terms: options.namedTerms }),
      findBlogCandidatesMatchingTerms({
        ...identity,
        terms: options.namedTerms,
        limit: resultLimit,
      }),
    ]);
    return {
      aggregate: { kind: "blog-filter-count" as const, value },
      candidates,
      maxPerDocument: 1,
      resultLimit,
      strategy,
    };
  }
  if (strategy === "experience-overview") {
    return {
      aggregate: null,
      candidates: await findExperienceOverviewCandidates({
        ...identity,
        limit: RETRIEVAL_RESULT_LIMIT,
      }),
      maxPerDocument: 1,
      resultLimit: RETRIEVAL_RESULT_LIMIT,
      strategy,
    };
  }
  return {
    aggregate: null,
    candidates: [],
    maxPerDocument: 2,
    resultLimit: RETRIEVAL_RESULT_LIMIT,
    strategy: null,
  };
}

function retrievalEvidence(results: readonly RetrievedKnowledge[], namedTerms: readonly string[]) {
  const foundNamedTerms = namedTerms.filter((term) =>
    results.some((result) => searchableCandidateText(result).includes(term.toLocaleLowerCase())),
  );
  const missingNamedTerms = namedTerms.filter((term) => !foundNamedTerms.includes(term));
  const kind = results.some((result) => result.structuredRank)
    ? "structured"
    : results.some((result) => result.semanticRank && result.keywordRank)
      ? "corroborated"
      : results.some((result) => result.keywordRank)
        ? "keyword"
        : results.length > 0
          ? "semantic"
          : "none";
  return { foundNamedTerms, kind, missingNamedTerms } as const;
}

function queryFingerprint(query: RetrievalQuery) {
  return `sha256:${createHash("sha256").update(query.original).digest("hex")}`;
}

export async function searchPortfolioKnowledge(options: {
  query: RetrievalQuery;
  classification: IntentClassification;
  sessionId?: string;
  messageId?: string;
  mode?: "dense" | "hybrid";
  recordEvent?: boolean;
}) {
  const startedAt = performance.now();
  const identity = {
    embeddingModel: getAssistantModels().embeddingModelId,
    indexVersion: ASSISTANT_INDEX_VERSION,
  };
  const structured = await structuredCandidates(
    {
      query: options.query.original,
      classification: options.classification,
      namedTerms: options.query.namedTerms,
    },
    identity,
  );
  let semantic: CandidateRow[] = [];
  let keyword: CandidateRow[] = [];
  let embeddingFailed = false;

  if (structured.candidates.length === 0 && !structured.aggregate) {
    const semanticPromise = semanticCandidates(
      options.query.semantic,
      options.classification.sourceTypes,
      identity,
    );
    const keywordPromise =
      options.mode === "dense"
        ? Promise.resolve([])
        : keywordCandidates(options.query.keyword, options.classification.sourceTypes, identity);
    const [semanticResult, keywordResult] = await Promise.allSettled([
      semanticPromise,
      keywordPromise,
    ]);

    if (semanticResult.status === "fulfilled") {
      semantic = semanticResult.value;
    } else {
      embeddingFailed = true;
      log("warn", "portfolio semantic retrieval failed; using keyword retrieval", {
        ...errorLogMetadata(semanticResult.reason, "assistant.semanticRetrieval"),
      });
    }
    if (keywordResult.status === "fulfilled") {
      keyword = keywordResult.value;
    } else {
      log("warn", "portfolio keyword retrieval failed; using semantic retrieval", {
        ...errorLogMetadata(keywordResult.reason, "assistant.keywordRetrieval"),
      });
    }
  }

  const ranked: RetrievedKnowledge[] =
    structured.candidates.length > 0
      ? structured.candidates.map((candidate, index) => ({
          ...candidate,
          structuredRank: index + 1,
          score: 1 / (index + 1),
        }))
      : fuseCandidates(semantic, keyword, options.classification.intent);
  const results = finalizeCandidates(
    ranked,
    options.query.namedTerms,
    structured.maxPerDocument,
    structured.resultLimit,
  );
  const evidence = retrievalEvidence(results, options.query.namedTerms);
  const eventResults: RetrievalResultMetadata[] = results.map((result) => ({
    chunkId: result.chunkId,
    documentId: result.documentId,
    ...(result.structuredRank ? { structuredRank: result.structuredRank } : {}),
    ...(result.semanticRank ? { semanticRank: result.semanticRank } : {}),
    ...(result.semanticSimilarity !== undefined
      ? { semanticSimilarity: result.semanticSimilarity }
      : {}),
    ...(result.keywordRank ? { keywordRank: result.keywordRank } : {}),
    score: result.score,
  }));

  if (options.recordEvent !== false) {
    await createRetrievalEvent({
      ...(options.sessionId ? { sessionId: options.sessionId } : {}),
      ...(options.messageId ? { messageId: options.messageId } : {}),
      query: queryFingerprint(options.query),
      intent: options.classification.intent,
      results: eventResults,
      latencyMs: Math.round(performance.now() - startedAt),
    });
  }

  return {
    aggregate: structured.aggregate,
    embeddingFailed,
    evidence,
    resultLimit: structured.resultLimit,
    results,
    sources: sourcesFromKnowledge(results),
    strategy: structured.strategy ?? options.mode ?? "hybrid",
  };
}
