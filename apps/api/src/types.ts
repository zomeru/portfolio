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

export type KnowledgeSourceType = "profile" | "experience" | "project" | "blog" | "techstack";

export type AskZomerSource = {
  id: string;
  title: string;
  url: string;
  sourceType: KnowledgeSourceType;
};

export type AskZomerMessageMetadata = {
  createdAt: string;
  intent?: QueryIntent;
  model?: string;
  sources?: AskZomerSource[];
  suggestions?: string[];
};

export type AskZomerMessage = UIMessage<AskZomerMessageMetadata>;

export const INITIAL_ASK_ZOMER_SUGGESTIONS = [
  "What's Zomer's experience?",
  "What projects has he built?",
  "What's his backend experience?",
  "What technologies does he use?",
  "What has he written about?",
] as const;
