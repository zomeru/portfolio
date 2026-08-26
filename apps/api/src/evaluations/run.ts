import { generateText } from "ai";

import { getAssistantModels } from "../services/ai/models";
import {
  normalizeAssistantCitations,
  normalizeCitationStream,
} from "../services/assistant/citations";
import { classifyQueryIntent } from "../services/assistant/intent";
import { buildAssistantSystemPrompt } from "../services/assistant/prompts";
import { createRetrievalQuery } from "../services/assistant/query";
import {
  createBlogCountMessage,
  createCompanyCountMessage,
  createExperienceBoundaryMessage,
  createFilteredBlogListMessage,
  createLatestBlogMessage,
  createOldestBlogListMessage,
  createRecentBlogListMessage,
} from "../services/assistant/responses";
import {
  classifyStructuredRetrieval,
  recentBlogResultLimit,
  searchPortfolioKnowledge,
} from "../services/assistant/retrieval";
import type { ConversationMessage, RetrievedKnowledge } from "../services/assistant/types";
import { type EvaluationCase, evaluationDataset } from "./dataset";

type RetrievalMetrics = {
  cases: number;
  contextPrecision: number;
  hits: number;
  ndcg: number;
  reciprocalRank: number;
  recall: number;
};

function evaluateCase(item: EvaluationCase) {
  const history: ConversationMessage[] = [];
  let classification = classifyQueryIntent(item.turns[0] ?? "", history);
  let query = createRetrievalQuery(item.turns[0] ?? "", classification, history);

  for (let index = 0; index < item.turns.length; index += 1) {
    const turn = item.turns[index] ?? "";
    classification = classifyQueryIntent(turn, history);
    query = createRetrievalQuery(turn, classification, history);
    if (index === item.turns.length - 1) break;
    history.push({
      id: `${item.name}-${index}`,
      role: "user",
      content: turn,
      intent: classification.intent,
      createdAt: new Date(0),
    });
    history.push({
      id: `${item.name}-${index}-answer`,
      role: "assistant",
      content: "Previous grounded answer",
      intent: classification.intent,
      createdAt: new Date(0),
    });
  }

  return { classification, history, query };
}

function includesTerm(value: string, term: string) {
  return value.toLocaleLowerCase().includes(term.toLocaleLowerCase());
}

function isRelevant(item: EvaluationCase, result: RetrievedKnowledge) {
  if (!item.expectedSourceTypes.includes(result.sourceType)) return false;
  if (!item.expectedTerms?.length) return true;
  return item.expectedTerms.some((term) => includesTerm(result.content, term));
}

function discountedCumulativeGain(values: readonly number[]) {
  return values.reduce((total, value, index) => total + value / Math.log2(index + 2), 0);
}

function updateRetrievalMetrics(
  metrics: RetrievalMetrics,
  item: EvaluationCase,
  results: readonly RetrievedKnowledge[],
) {
  metrics.cases += 1;
  const relevance = results.map((result) => (isRelevant(item, result) ? 1 : 0));
  const firstRelevant = relevance.findIndex(Boolean);
  if (firstRelevant >= 0) {
    metrics.hits += 1;
    metrics.reciprocalRank += 1 / (firstRelevant + 1);
  }

  const eligibleText = results
    .filter((result) => item.expectedSourceTypes.includes(result.sourceType))
    .map((result) => result.content)
    .join("\n");
  metrics.recall += item.expectedTerms?.length
    ? item.expectedTerms.filter((term) => includesTerm(eligibleText, term)).length /
      item.expectedTerms.length
    : firstRelevant >= 0
      ? 1
      : 0;

  const ideal = [...relevance].sort((left, right) => right - left);
  const idealScore = discountedCumulativeGain(ideal);
  metrics.ndcg += idealScore > 0 ? discountedCumulativeGain(relevance) / idealScore : 0;
  metrics.contextPrecision +=
    results.length > 0 ? relevance.filter(Boolean).length / results.length : 0;
}

function emptyRetrievalMetrics(): RetrievalMetrics {
  return { cases: 0, contextPrecision: 0, hits: 0, ndcg: 0, reciprocalRank: 0, recall: 0 };
}

function printRetrievalMetrics(label: string, metrics: RetrievalMetrics) {
  const divisor = Math.max(1, metrics.cases);
  console.log(`${label} Hit Rate@6: ${metrics.hits}/${metrics.cases}`);
  console.log(`${label} Recall@6: ${(metrics.recall / divisor).toFixed(3)}`);
  console.log(`${label} MRR: ${(metrics.reciprocalRank / divisor).toFixed(3)}`);
  console.log(`${label} nDCG@6: ${(metrics.ndcg / divisor).toFixed(3)}`);
  console.log(`${label} context relevance: ${(metrics.contextPrecision / divisor).toFixed(3)}`);
}

function expectedQueryMatches(
  item: EvaluationCase,
  query: ReturnType<typeof createRetrievalQuery>,
) {
  const keywordMatches = (item.expectedKeywordTerms ?? []).every((term) =>
    includesTerm(query.keyword, term),
  );
  const semanticMatches = (item.expectedSemanticTerms ?? []).every((term) =>
    includesTerm(query.semantic, term),
  );
  const namedMatches = (item.expectedNamedTerms ?? []).every((term) =>
    query.namedTerms.some(
      (candidate) => candidate.toLocaleLowerCase() === term.toLocaleLowerCase(),
    ),
  );
  return keywordMatches && semanticMatches && namedMatches;
}

async function normalizedStreamingText() {
  const transform = normalizeCitationStream(2)();
  const reader = transform.readable.getReader();
  let output = "";
  const reading = (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.type === "text-delta") output += value.text;
    }
  })();
  const writer = transform.writable.getWriter();
  await writer.write({ type: "text-start", id: "answer" });
  await writer.write({ type: "text-delta", id: "answer", text: "Claim【1†" });
  await writer.write({ type: "text-delta", id: "answer", text: "L1-L7】【2†L4" });
  await writer.write({ type: "text-delta", id: "answer", text: "-L9】" });
  await writer.write({ type: "text-end", id: "answer" });
  await writer.close();
  await reading;
  return output;
}

const live = process.argv.includes("--live");
const denseMetrics = emptyRetrievalMetrics();
const hybridMetrics = emptyRetrievalMetrics();
let intentPassed = 0;
let queryTransformationPassed = 0;
let structuredRetrievalCases = 0;
let structuredRetrievalPassed = 0;
let groundedCases = 0;
let groundedPassed = 0;
let citationCorrect = 0;
let answerCorrect = 0;
let answerRelevant = 0;
let hallucinations = 0;

const citationNormalizationCases = [
  {
    actual: normalizeAssistantCitations("Claim【1†L1-L7】【2†L4-L9】", 2),
    expected: "Claim[1][2]",
  },
  {
    actual: normalizeAssistantCitations("Claim 【 1 † L12 - L14 】", 1),
    expected: "Claim [1]",
  },
  {
    actual: normalizeAssistantCitations("Claim【3†L1-L7】", 2),
    expected: "Claim",
  },
  { actual: normalizeAssistantCitations("Claim【1】", 1), expected: "Claim[1]" },
  { actual: normalizeAssistantCitations("Claim [1]", 1), expected: "Claim [1]" },
] as const;
const citationNormalizationPassed = citationNormalizationCases.filter(
  ({ actual, expected }) => actual === expected,
).length;
const citationStreamPassed = (await normalizedStreamingText()) === "Claim[1][2]";
const recentBlogLimitCases = [
  { actual: recentBlogResultLimit("List 2 recent blogs"), expected: 2 },
  { actual: recentBlogResultLimit("Show twelve latest articles"), expected: 12 },
  { actual: recentBlogResultLimit("What are Zomer's recent blogs?"), expected: 5 },
  { actual: recentBlogResultLimit("List 99 recent posts"), expected: 20 },
] as const;
const recentBlogLimitsPassed = recentBlogLimitCases.filter(
  ({ actual, expected }) => actual === expected,
).length;
const deterministicBlogResponseCases = [
  {
    actual: createRecentBlogListMessage([
      { publishedAt: "2026-08-22T00:00:00.000Z", title: "First blog" },
      { publishedAt: "2026-08-21T00:00:00.000Z", title: "Second blog" },
    ]),
    expected:
      "Here are Zomer's 2 most recent indexed blog posts:\n\n- **First blog** — published 2026-08-22 [1]\n- **Second blog** — published 2026-08-21 [2]",
  },
  {
    actual: createBlogCountMessage(137),
    expected: "Zomer has 137 published blog posts in the current portfolio index.",
  },
  {
    actual: createOldestBlogListMessage([
      { publishedAt: "2024-01-01T00:00:00.000Z", title: "Oldest blog" },
      { publishedAt: "2024-02-01T00:00:00.000Z", title: "Second oldest blog" },
    ]),
    expected:
      "Here are Zomer's 2 oldest indexed blog posts, oldest first:\n\n- **Oldest blog** — published 2024-01-01 [1]\n- **Second oldest blog** — published 2024-02-01 [2]",
  },
  {
    actual: createLatestBlogMessage(
      { publishedAt: "2024-01-01T00:00:00.000Z", title: "Oldest blog" },
      "oldest",
    ),
    expected:
      "Zomer's oldest indexed blog post is:\n\n- **Oldest blog** — published 2024-01-01 [1]",
  },
  {
    actual: createFilteredBlogListMessage({
      blogs: [{ publishedAt: "2026-01-01T00:00:00.000Z", title: "Next.js article" }],
      terms: ["Next.js"],
      total: 1,
    }),
    expected:
      "I found 1 indexed blog post mentioning **Next.js**:\n\n1. **Next.js article** — published 2026-01-01 [1]",
  },
  {
    actual: createCompanyCountMessage(5),
    expected:
      "Zomer has worked for 5 distinct companies or organizations in the current portfolio index.",
  },
  {
    actual: createExperienceBoundaryMessage(
      {
        company: "Example Co",
        period: "Jan 2020 – Dec 2020",
        role: "Developer",
        title: "Developer at Example Co",
      },
      "oldest",
    ),
    expected:
      "Zomer's earliest indexed work experience is:\n\n- **Developer** at **Example Co** — Jan 2020 – Dec 2020 [1]",
  },
] as const;
const deterministicBlogResponsesPassed = deterministicBlogResponseCases.filter(
  ({ actual, expected }) => actual === expected,
).length;

for (const item of evaluationDataset) {
  const { classification, query } = evaluateCase(item);
  const intentMatches = classification.intent === item.expectedIntent;
  if (intentMatches) intentPassed += 1;
  console.log(`Intent ${intentMatches ? "PASS" : "FAIL"}: ${item.name} (${classification.intent})`);

  const queryMatches = expectedQueryMatches(item, query);
  if (queryMatches) queryTransformationPassed += 1;
  console.log(`Query ${queryMatches ? "PASS" : "FAIL"}: ${item.name}`);

  if (item.expectedStructuredRetrieval) {
    structuredRetrievalCases += 1;
    const strategy = classifyStructuredRetrieval({
      query: query.original,
      classification,
      namedTerms: query.namedTerms,
    });
    const strategyMatches = strategy === item.expectedStructuredRetrieval;
    if (strategyMatches) structuredRetrievalPassed += 1;
    console.log(
      `Structured retrieval ${strategyMatches ? "PASS" : "FAIL"}: ${item.name} (${strategy ?? "none"})`,
    );
  }

  if (!live || classification.intent === "general") continue;
  const [dense, hybrid] = await Promise.all([
    searchPortfolioKnowledge({ query, classification, mode: "dense", recordEvent: false }),
    searchPortfolioKnowledge({ query, classification, mode: "hybrid", recordEvent: false }),
  ]);
  if (!item.expectNoEvidence && !hybrid.aggregate) {
    updateRetrievalMetrics(denseMetrics, item, dense.results);
    updateRetrievalMetrics(hybridMetrics, item, hybrid.results);
  }

  const namedFactIsUnsupported =
    query.namedTerms.length === 1 &&
    hybrid.evidence.missingNamedTerms.length === query.namedTerms.length;
  let answerText: string;
  if (hybrid.aggregate?.kind === "blog-count") {
    answerText = createBlogCountMessage(hybrid.aggregate.value);
  } else if (hybrid.aggregate?.kind === "company-count") {
    answerText = createCompanyCountMessage(hybrid.aggregate.value);
  } else if (hybrid.results.length === 0 || namedFactIsUnsupported) {
    answerText = "The indexed portfolio does not provide evidence for that information.";
  } else {
    const models = getAssistantModels();
    const answer = await generateText({
      model: models.chat,
      system: buildAssistantSystemPrompt(classification, hybrid.results, {
        resultLimit: hybrid.resultLimit,
        strategy: hybrid.strategy,
      }),
      prompt: query.original,
      maxOutputTokens: 500,
      maxRetries: 1,
      ...models.chatGenerationOptions,
      telemetry: { functionId: "ask-zomer.evaluation", recordInputs: false, recordOutputs: false },
    });
    answerText = answer.text;
  }

  const markers = [...answerText.matchAll(/\[(\d+)]/g)].map((match) => Number(match[1]));
  const sourceDocumentIds = [...new Set(hybrid.results.map((result) => result.documentId))];
  const markersAreValid =
    markers.length > 0 &&
    markers.every((marker) => marker >= 1 && marker <= sourceDocumentIds.length);
  const citedSourcesAreRelevant = markers.every((marker) =>
    hybrid.results.some(
      (result) => result.documentId === sourceDocumentIds[marker - 1] && isRelevant(item, result),
    ),
  );
  const admitsNoEvidence =
    /(?:does not|doesn't|do not|don't|no|not|insufficient|unavailable).{0,60}(?:evidence|information|portfolio)/i.test(
      answerText,
    ) ||
    /(?:evidence|information|portfolio).{0,60}(?:does not|doesn't|no|not|insufficient|unavailable)/i.test(
      answerText,
    );
  const aggregateIsValid =
    ((item.expectedStructuredRetrieval === "blog-count" &&
      hybrid.aggregate?.kind === "blog-count") ||
      (item.expectedStructuredRetrieval === "company-count" &&
        hybrid.aggregate?.kind === "company-count")) &&
    answerText.includes(String(hybrid.aggregate.value));
  const grounded = aggregateIsValid || (item.expectNoEvidence ? admitsNoEvidence : markersAreValid);
  const citationsMatch = aggregateIsValid
    ? markers.length === 0
    : item.expectNoEvidence
      ? markers.length === 0 && admitsNoEvidence
      : markersAreValid && citedSourcesAreRelevant;
  const correct =
    aggregateIsValid ||
    (item.expectNoEvidence
      ? admitsNoEvidence
      : !item.expectedTerms?.length ||
        item.expectedTerms.some((term) => includesTerm(answerText, term)));
  groundedCases += 1;
  if (grounded) groundedPassed += 1;
  if (citationsMatch) citationCorrect += 1;
  if (correct) answerCorrect += 1;
  if (answerText.trim() && (correct || grounded)) answerRelevant += 1;
  if (item.expectNoEvidence && !admitsNoEvidence) hallucinations += 1;
}

console.log(`Intent accuracy: ${intentPassed}/${evaluationDataset.length}`);
console.log(`Query transformation: ${queryTransformationPassed}/${evaluationDataset.length}`);
console.log(`Structured retrieval: ${structuredRetrievalPassed}/${structuredRetrievalCases}`);
console.log(
  `Citation normalization: ${citationNormalizationPassed}/${citationNormalizationCases.length}`,
);
console.log(`Citation stream normalization: ${citationStreamPassed ? "PASS" : "FAIL"}`);
console.log(`Recent blog limits: ${recentBlogLimitsPassed}/${recentBlogLimitCases.length}`);
console.log(
  `Deterministic blog responses: ${deterministicBlogResponsesPassed}/${deterministicBlogResponseCases.length}`,
);
if (live) {
  printRetrievalMetrics("Dense", denseMetrics);
  printRetrievalMetrics("Hybrid", hybridMetrics);
  console.log(`Grounded responses: ${groundedPassed}/${groundedCases}`);
  console.log(`Citation correctness: ${citationCorrect}/${groundedCases}`);
  console.log(`Answer correctness: ${answerCorrect}/${groundedCases}`);
  console.log(`Answer relevance: ${answerRelevant}/${groundedCases}`);
  console.log(`Hallucination rate: ${hallucinations}/${groundedCases}`);
} else {
  console.log(
    "Dense/hybrid retrieval and generation metrics skipped (run pnpm ai:eval --live after an authorized full reindex).",
  );
}

if (intentPassed !== evaluationDataset.length) process.exitCode = 1;
if (queryTransformationPassed !== evaluationDataset.length) process.exitCode = 1;
if (structuredRetrievalPassed !== structuredRetrievalCases) process.exitCode = 1;
if (citationNormalizationPassed !== citationNormalizationCases.length) process.exitCode = 1;
if (!citationStreamPassed) process.exitCode = 1;
if (recentBlogLimitsPassed !== recentBlogLimitCases.length) process.exitCode = 1;
if (deterministicBlogResponsesPassed !== deterministicBlogResponseCases.length) {
  process.exitCode = 1;
}
if (
  live &&
  (hybridMetrics.hits !== hybridMetrics.cases ||
    groundedPassed !== groundedCases ||
    citationCorrect !== groundedCases ||
    hallucinations > 0)
) {
  process.exitCode = 1;
}
