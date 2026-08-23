import { generateText } from "ai";
import { getAssistantModels } from "../services/ai/models";
import { classifyQueryIntent } from "../services/assistant/intent";
import { buildAssistantSystemPrompt } from "../services/assistant/prompts";
import {
  classifyStructuredRetrieval,
  searchPortfolioKnowledge,
} from "../services/assistant/retrieval";
import type { ConversationMessage } from "../services/assistant/types";
import { type EvaluationCase, evaluationDataset } from "./dataset";

function evaluateIntent(item: EvaluationCase) {
  const history: ConversationMessage[] = [];
  let classification = classifyQueryIntent(item.turns[0] ?? "", history);

  for (let index = 0; index < item.turns.length; index += 1) {
    const turn = item.turns[index] ?? "";
    classification = classifyQueryIntent(turn, history);
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
      content: "Previous answer",
      intent: classification.intent,
      createdAt: new Date(0),
    });
  }

  return classification;
}

function isRelevant(item: EvaluationCase, sourceType: string, content: string) {
  if (!item.expectedSourceTypes.includes(sourceType as never)) return false;
  if (!item.expectedTerms?.length) return true;
  const includesExpectedTerm = item.expectedTerms.some((term) =>
    content.toLocaleLowerCase().includes(term.toLocaleLowerCase()),
  );
  return item.expectNoEvidence ? !includesExpectedTerm : includesExpectedTerm;
}

const live = process.argv.includes("--live");
let intentPassed = 0;
let structuredRetrievalCases = 0;
let structuredRetrievalPassed = 0;
let retrievalCases = 0;
let retrievalHits = 0;
let reciprocalRankTotal = 0;
let groundedCases = 0;
let groundedPassed = 0;

for (const item of evaluationDataset) {
  const classification = evaluateIntent(item);
  const intentMatches = classification.intent === item.expectedIntent;
  if (intentMatches) intentPassed += 1;
  console.log(`Intent ${intentMatches ? "PASS" : "FAIL"}: ${item.name} (${classification.intent})`);

  if (item.expectedStructuredRetrieval) {
    structuredRetrievalCases += 1;
    const strategy = classifyStructuredRetrieval({
      query: item.turns.at(-1) ?? "",
      classification,
    });
    const strategyMatches = strategy === item.expectedStructuredRetrieval;
    if (strategyMatches) structuredRetrievalPassed += 1;
    console.log(
      `Structured retrieval ${strategyMatches ? "PASS" : "FAIL"}: ${item.name} (${strategy ?? "none"})`,
    );
  }

  if (!live || classification.intent === "general") continue;
  retrievalCases += 1;
  const query = item.turns.at(-1) ?? "";
  const retrieval = await searchPortfolioKnowledge({ query, classification });
  const firstRelevant = retrieval.results.findIndex((result) =>
    isRelevant(item, result.sourceType, result.content),
  );
  if (firstRelevant >= 0) {
    retrievalHits += 1;
    reciprocalRankTotal += 1 / (firstRelevant + 1);
  }

  const models = getAssistantModels();
  const answer = await generateText({
    model: models.chat,
    system: buildAssistantSystemPrompt(classification, retrieval.results),
    prompt: query,
    maxOutputTokens: 500,
    maxRetries: 1,
    telemetry: { functionId: "ask-zomer.evaluation", recordInputs: false, recordOutputs: false },
  });
  const markers = [...answer.text.matchAll(/\[(\d+)]/g)].map((match) => Number(match[1]));
  const hasValidMarkers =
    retrieval.sources.length > 0 &&
    markers.length > 0 &&
    markers.every((marker) => marker >= 1 && marker <= retrieval.sources.length);
  const admitsNoEvidence = /(?:no|not|don't|doesn't|insufficient).{0,50}evidence/i.test(
    answer.text,
  );
  const grounded = item.expectNoEvidence ? admitsNoEvidence : hasValidMarkers;
  groundedCases += 1;
  if (grounded) groundedPassed += 1;
}

console.log(`Intent accuracy: ${intentPassed}/${evaluationDataset.length}`);
console.log(`Structured retrieval: ${structuredRetrievalPassed}/${structuredRetrievalCases}`);
if (live) {
  console.log(`Retrieval Hit@6: ${retrievalHits}/${retrievalCases}`);
  console.log(`Retrieval MRR: ${(reciprocalRankTotal / Math.max(1, retrievalCases)).toFixed(3)}`);
  console.log(`Grounded responses: ${groundedPassed}/${groundedCases}`);
} else {
  console.log(
    "Retrieval and groundedness: skipped (run pnpm ai:eval --live after migrating and indexing)",
  );
}

if (intentPassed !== evaluationDataset.length) process.exitCode = 1;
if (structuredRetrievalPassed !== structuredRetrievalCases) process.exitCode = 1;
if (live && (retrievalHits !== retrievalCases || groundedPassed !== groundedCases))
  process.exitCode = 1;
