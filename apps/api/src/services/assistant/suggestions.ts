import { INITIAL_ASK_ZOMER_SUGGESTIONS } from "../../types";
import type { IntentClassification, RetrievedKnowledge } from "./types";

function technologiesFromResults(results: readonly RetrievedKnowledge[]) {
  const technologies = new Set<string>();
  for (const result of results) {
    const value = result.metadata.technologies;
    if (!Array.isArray(value)) continue;
    for (const technology of value) {
      if (typeof technology === "string" && technology.length <= 30) technologies.add(technology);
    }
  }
  return [...technologies].slice(0, 2);
}

export function createFollowUpSuggestions(
  classification: IntentClassification,
  results: readonly RetrievedKnowledge[],
) {
  const technologies = technologiesFromResults(results);

  if (classification.intent === "general") {
    return [...INITIAL_ASK_ZOMER_SUGGESTIONS.slice(0, 3)];
  }
  if (classification.intent === "blog") {
    return [
      "What topics does he write about?",
      "Which article should I read first?",
      "Show me his projects.",
    ];
  }
  if (classification.intent === "project") {
    return [
      technologies[0]
        ? `Which projects use ${technologies[0]}?`
        : "Which project is most technical?",
      "What backend projects has he built?",
      "What was his role in these projects?",
    ];
  }
  if (classification.intent === "techstack") {
    return [
      technologies[0]
        ? `Where has he used ${technologies[0]}?`
        : "Which backend technologies does he use?",
      technologies[1]
        ? `Which projects use ${technologies[1]}?`
        : "Which technologies appear in his projects?",
      "Which databases does he use?",
    ];
  }
  if (classification.intent === "navigation") {
    return ["What's his recent experience?", "Show me his projects.", "What has he written about?"];
  }

  return [
    technologies[0]
      ? `What ${technologies[0]} experience does he have?`
      : "What backend experience does he have?",
    technologies[1] ? `Which projects use ${technologies[1]}?` : "Which projects can I see?",
    "What roles has he held?",
  ];
}
