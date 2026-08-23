import type { KnowledgeSourceType, QueryIntent } from "../../types";

export type IntentClassification = {
  intent: QueryIntent;
  confidence: number;
  sourceTypes: KnowledgeSourceType[];
};

export type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent: QueryIntent | null;
  createdAt: Date;
};

export type NormalizedSection = {
  heading: string;
  text: string;
};

export type NormalizedKnowledgeDocument = {
  sanityDocumentId: string;
  sourceType: KnowledgeSourceType;
  slug: string | null;
  title: string;
  canonicalUrl: string;
  sanityUpdatedAt: Date;
  metadata: Record<string, unknown>;
  sections: NormalizedSection[];
};

export type KnowledgeChunkInput = {
  chunkIndex: number;
  content: string;
  metadata: Record<string, unknown>;
  tokenCount: number;
};

export type RetrievedKnowledge = {
  chunkId: string;
  documentId: string;
  content: string;
  metadata: Record<string, unknown>;
  sourceType: KnowledgeSourceType;
  title: string;
  canonicalUrl: string;
  structuredRank?: number;
  semanticRank?: number;
  keywordRank?: number;
  score: number;
};
