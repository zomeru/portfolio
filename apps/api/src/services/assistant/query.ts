import type { ConversationMessage, IntentClassification, RetrievalQuery } from "./types";

const TOPIC_LABELS: Record<IntentClassification["intent"], string> = {
  blog: "blog articles",
  experience: "work experience",
  general: "general knowledge",
  navigation: "portfolio links and contact details",
  portfolio: "portfolio",
  profile: "profile and background",
  project: "projects",
  techstack: "technology stack",
};

const QUERY_STOP_WORDS = new Set([
  "a",
  "about",
  "all",
  "also",
  "an",
  "and",
  "are",
  "at",
  "be",
  "been",
  "building",
  "built",
  "can",
  "did",
  "do",
  "does",
  "for",
  "from",
  "has",
  "have",
  "he",
  "her",
  "him",
  "his",
  "how",
  "i",
  "in",
  "is",
  "it",
  "latest",
  "oldes",
  "oldest",
  "earliest",
  "me",
  "most",
  "my",
  "of",
  "on",
  "one",
  "ones",
  "or",
  "please",
  "professional",
  "professionally",
  "recent",
  "recommend",
  "recommendation",
  "recommendations",
  "recommended",
  "saas",
  "tell",
  "technologies",
  "technology",
  "that",
  "the",
  "their",
  "them",
  "they",
  "this",
  "to",
  "use",
  "used",
  "was",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
  "work",
  "worked",
  "wrote",
  "written",
  "you",
  "your",
  "zomer",
  "zomers",
]);

const TERM_ALIASES = new Map<string, string>([
  ["nextjs", "Next.js"],
  ["next.js", "Next.js"],
  ["nodejs", "Node.js"],
  ["node.js", "Node.js"],
  ["postgres", "PostgreSQL"],
  ["postgresql", "PostgreSQL"],
  ["reactjs", "React"],
]);

const KNOWN_NAMED_TERMS = new Set([
  "ai",
  "bun",
  "celery",
  "django",
  "drizzle",
  "firebase",
  "groq",
  "hono",
  "javascript",
  "mongodb",
  "next.js",
  "nextjs",
  "node.js",
  "nodejs",
  "openrouter",
  "pgvector",
  "postgres",
  "postgresql",
  "prisma",
  "rag",
  "react",
  "reactjs",
  "sanity",
  "supabase",
  "turborepo",
  "typescript",
]);

const CONTEXTUAL_FOLLOW_UP =
  /^(?:and\b|also\b|did (?:it|they)\b|how about\b|tell me more\b|what about\b|what else\b|which (?:one|ones)\b|why\b|latest\b|recent\b|newest\b|oldest\b|oldes\b|earliest\b)|\b(?:that (?:company|project|role)|those|them)\b/i;

function queryTokens(query: string) {
  return query.match(/[\p{L}\p{N}][\p{L}\p{N}.+#/-]*/gu) ?? [];
}

function canonicalTerm(value: string) {
  return TERM_ALIASES.get(value.toLocaleLowerCase()) ?? value;
}

function keywordQuery(query: string, fallback: string) {
  const terms = queryTokens(query)
    .map((token) => token.replace(/[’']s$/i, ""))
    .filter((token) => token.length > 1 && !QUERY_STOP_WORDS.has(token.toLocaleLowerCase()))
    .map(canonicalTerm);
  return [...new Set(terms)].join(" ") || fallback;
}

function namedTerms(query: string) {
  const terms = queryTokens(query).flatMap((token, index) => {
    const normalized = token.replace(/[’']s$/i, "");
    const lower = normalized.toLocaleLowerCase();
    if (lower === "zomer" || lower === "gregorio" || QUERY_STOP_WORDS.has(lower)) return [];
    if (KNOWN_NAMED_TERMS.has(lower)) return [canonicalTerm(normalized)];
    if (index > 0 && /^\p{Lu}[\p{L}\p{N}.+#/-]+$/u.test(normalized)) return [normalized];
    if (/^[A-Z0-9+#.-]{2,}$/u.test(normalized)) return [normalized];
    return [];
  });
  return [...new Set(terms)];
}

function previousPortfolioQuestion(history: readonly ConversationMessage[]) {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const message = history[index];
    if (message?.role === "user" && message.intent && message.intent !== "general") {
      return message.content.replace(/\s+/g, " ").trim().slice(0, 280);
    }
  }
  return null;
}

export function createRetrievalQuery(
  query: string,
  classification: IntentClassification,
  history: readonly ConversationMessage[],
): RetrievalQuery {
  const original = query.replace(/\s+/g, " ").trim();
  const topic = TOPIC_LABELS[classification.intent];
  const previous = CONTEXTUAL_FOLLOW_UP.test(original) ? previousPortfolioQuestion(history) : null;
  const conversationalContext = previous ? ` Previous question: ${previous}.` : "";

  return {
    keyword: keywordQuery(original, topic),
    namedTerms: namedTerms(original),
    original,
    semantic: `Portfolio owner: Zomer Gregorio. Topic: ${topic}.${conversationalContext} Current question: ${original}`,
  };
}
