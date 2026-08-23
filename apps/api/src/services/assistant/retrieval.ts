import {
  createRetrievalEvent,
  findExperienceOverviewCandidates,
  findKeywordKnowledgeCandidates,
  findLatestKnowledgeCandidates,
  findSemanticKnowledgeCandidates,
  type KnowledgeCandidate,
  type RetrievalResultMetadata,
} from "@portfolio/database";
import { log } from "../../lib/log";
import type { AskZomerSource, KnowledgeSourceType } from "../../types";
import { embedQuery } from "./embeddings";
import type { IntentClassification, RetrievedKnowledge } from "./types";

const CANDIDATE_LIMIT = 12;
const RESULT_LIMIT = 6;
const RRF_K = 60;
const RECENCY_QUERY = /\b(latest|most recent|newest|current|recent)\b/i;
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

function sourceBoost(sourceType: KnowledgeSourceType, intent: IntentClassification["intent"]) {
  if (intent === "blog") return sourceType === "blog" ? 0.004 : -0.002;
  if (intent === "project") return sourceType === "project" ? 0.003 : 0;
  if (intent === "experience") return sourceType === "experience" ? 0.003 : 0;
  if (intent === "techstack") return sourceType === "techstack" ? 0.004 : 0.001;
  if (intent === "profile" || intent === "navigation") return sourceType === "profile" ? 0.003 : 0;
  return sourceType === "blog" ? -0.001 : 0.001;
}

async function semanticCandidates(query: string, sourceTypes: KnowledgeSourceType[]) {
  const embedding = await embedQuery(query);
  return findSemanticKnowledgeCandidates({
    embedding,
    sourceTypes,
    limit: CANDIDATE_LIMIT,
  });
}

async function keywordCandidates(query: string, sourceTypes: KnowledgeSourceType[]) {
  return findKeywordKnowledgeCandidates({ query, sourceTypes, limit: CANDIDATE_LIMIT });
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
      existing.score += 0.62 / (RRF_K + rank);
    } else {
      existing.keywordRank = rank;
      existing.score += 0.38 / (RRF_K + rank);
    }
    fused.set(candidate.chunkId, existing);
  };

  semantic.forEach((candidate, index) => {
    add(candidate, index + 1, "semantic");
  });
  keyword.forEach((candidate, index) => {
    add(candidate, index + 1, "keyword");
  });

  return [...fused.values()].sort((left, right) => right.score - left.score).slice(0, RESULT_LIMIT);
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

function latestSourceType(options: {
  query: string;
  classification: IntentClassification;
}): "blog" | "experience" | undefined {
  if (!RECENCY_QUERY.test(options.query)) return undefined;
  if (options.classification.intent === "blog") return "blog";
  if (options.classification.intent === "experience") return "experience";
  return undefined;
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
}): "latest-blog" | "latest-experience" | "experience-overview" | null {
  const latestType = latestSourceType(options);
  if (latestType === "blog") return "latest-blog";
  if (latestType === "experience") return "latest-experience";
  if (isBroadExperienceQuery(options)) return "experience-overview";
  return null;
}

async function structuredCandidates(options: {
  query: string;
  classification: IntentClassification;
}) {
  const strategy = classifyStructuredRetrieval(options);
  if (strategy === "latest-blog") {
    return findLatestKnowledgeCandidates({ sourceType: "blog", limit: 3 });
  }
  if (strategy === "latest-experience") {
    return findLatestKnowledgeCandidates({ sourceType: "experience", limit: 3 });
  }
  if (strategy === "experience-overview") {
    return findExperienceOverviewCandidates(RESULT_LIMIT);
  }
  return [];
}

export async function searchPortfolioKnowledge(options: {
  query: string;
  classification: IntentClassification;
  sessionId?: string;
  messageId?: string;
}) {
  const startedAt = performance.now();
  const structured = await structuredCandidates(options);
  let semantic: CandidateRow[] = [];
  let embeddingFailed = false;

  if (structured.length === 0) {
    try {
      semantic = await semanticCandidates(options.query, options.classification.sourceTypes);
    } catch (error) {
      embeddingFailed = true;
      log("warn", "portfolio query embedding failed; using keyword retrieval", {
        errorType: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  const keyword =
    structured.length === 0
      ? await keywordCandidates(options.query, options.classification.sourceTypes)
      : [];
  const results: RetrievedKnowledge[] =
    structured.length > 0
      ? structured.map((candidate, index) => ({
          ...candidate,
          structuredRank: index + 1,
          score: 1 / (index + 1),
        }))
      : fuseCandidates(semantic, keyword, options.classification.intent);
  const eventResults: RetrievalResultMetadata[] = results.map((result) => ({
    chunkId: result.chunkId,
    documentId: result.documentId,
    ...(result.structuredRank ? { structuredRank: result.structuredRank } : {}),
    ...(result.semanticRank ? { semanticRank: result.semanticRank } : {}),
    ...(result.keywordRank ? { keywordRank: result.keywordRank } : {}),
    score: result.score,
  }));

  await createRetrievalEvent({
    ...(options.sessionId ? { sessionId: options.sessionId } : {}),
    ...(options.messageId ? { messageId: options.messageId } : {}),
    query: options.query,
    intent: options.classification.intent,
    results: eventResults,
    latencyMs: Math.round(performance.now() - startedAt),
  });

  return { results, embeddingFailed, sources: sourcesFromKnowledge(results) };
}
