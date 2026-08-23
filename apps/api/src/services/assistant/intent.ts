import type { KnowledgeSourceType, QueryIntent } from "../../types";
import type { ConversationMessage, IntentClassification } from "./types";

const PERSONAL_REFERENCE =
  /\b(zomer|zomer's|you|your|yours|yourself|he|his|him|portfolio|resume|cv)\b/i;
const FOLLOW_UP =
  /^(and |also |what about|how about|what else|which ones|tell me more|why|when|where)\b/i;
const BLOG_TERMS = /\b(blog|blogs|article|articles|post|posts|wrote|written|writing|published)\b/i;
const PROJECT_TERMS = /\b(project|projects|built|build|portfolio work|case stud(?:y|ies))\b/i;
const EXPERIENCE_TERMS =
  /\b(experience|worked|work history|professional|professionally|job|jobs|role|roles|company|companies|career|employment|backend|frontend|full[ -]?stack)\b/i;
const PROFILE_TERMS = /\b(who|bio|biography|background|introduce|skills|technolog(?:y|ies))\b/i;
const NAVIGATION_TERMS = /\b(where|find|show|open|link|contact|email|github|linkedin|resume|cv)\b/i;
const TECH_STACK_TERMS =
  /\b(tech stack|technology stack|technologies|tools|languages|frameworks|libraries|databases|skills)\b/i;

const SOURCE_TYPES: Record<Exclude<QueryIntent, "general">, KnowledgeSourceType[]> = {
  profile: ["profile"],
  experience: ["experience", "project", "profile"],
  project: ["project", "experience"],
  blog: ["blog"],
  portfolio: ["profile", "experience", "project", "blog", "techstack"],
  navigation: ["profile", "project", "blog", "techstack"],
  techstack: ["techstack", "experience", "project"],
};

function mostRecentPortfolioIntent(history: readonly ConversationMessage[]) {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const intent = history[index]?.intent;
    if (intent && intent !== "general") return intent;
  }

  return null;
}

function classifyPortfolioIntent(query: string): Exclude<QueryIntent, "general"> {
  if (BLOG_TERMS.test(query)) return "blog";
  if (PROJECT_TERMS.test(query)) return "project";
  if (EXPERIENCE_TERMS.test(query)) return "experience";
  if (TECH_STACK_TERMS.test(query)) return "techstack";
  if (NAVIGATION_TERMS.test(query)) return "navigation";
  if (PROFILE_TERMS.test(query)) return "profile";
  return "portfolio";
}

export function classifyQueryIntent(
  query: string,
  history: readonly ConversationMessage[],
): IntentClassification {
  const recentPortfolioIntent = mostRecentPortfolioIntent(history.slice(-8));
  const hasPersonalReference = PERSONAL_REFERENCE.test(query);
  const isContextualFollowUp = Boolean(recentPortfolioIntent && FOLLOW_UP.test(query.trim()));

  if (!hasPersonalReference && !isContextualFollowUp) {
    return { intent: "general", confidence: 0.94, sourceTypes: [] };
  }

  let intent = classifyPortfolioIntent(query);
  if (isContextualFollowUp && intent === "portfolio" && recentPortfolioIntent) {
    intent = recentPortfolioIntent;
  }

  return {
    intent,
    confidence: hasPersonalReference ? 0.98 : 0.86,
    sourceTypes: SOURCE_TYPES[intent],
  };
}
