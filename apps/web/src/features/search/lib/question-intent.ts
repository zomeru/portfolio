import { normalizeSearchText } from "@/features/search/lib/rank";

const questionOpeners = new Set([
  "who",
  "what",
  "when",
  "where",
  "why",
  "how",
  "can",
  "does",
  "did",
  "is",
  "has",
]);

export function isLikelyQuestion(query: string, topScore = 0) {
  const trimmed = query.trim();
  const tokens = normalizeSearchText(trimmed).split(" ").filter(Boolean);
  if (trimmed.length < 8 || tokens.length < 2) return false;
  if (trimmed.endsWith("?")) return true;
  if (questionOpeners.has(tokens[0]!)) return true;
  return tokens.length >= 4 && topScore < 650;
}
