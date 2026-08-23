import type { KnowledgeSourceType, QueryIntent } from "../types";

export type EvaluationCase = {
  name: string;
  turns: string[];
  expectedIntent: QueryIntent;
  expectedSourceTypes: KnowledgeSourceType[];
  expectedTerms?: string[];
  expectNoEvidence?: boolean;
  expectedStructuredRetrieval?: "latest-blog" | "latest-experience" | "experience-overview";
};

export const evaluationDataset: EvaluationCase[] = [
  {
    name: "general",
    turns: ["What is React?"],
    expectedIntent: "general",
    expectedSourceTypes: [],
  },
  {
    name: "profile",
    turns: ["Who is Zomer?"],
    expectedIntent: "profile",
    expectedSourceTypes: ["profile"],
  },
  {
    name: "experience",
    turns: ["What's Zomer's backend experience?"],
    expectedIntent: "experience",
    expectedSourceTypes: ["experience", "project"],
  },
  {
    name: "experience summary",
    turns: ["Tell my about Zomer's experience. Just a summary."],
    expectedIntent: "experience",
    expectedSourceTypes: ["experience"],
    expectedTerms: ["Seansoft Corporation"],
    expectedStructuredRetrieval: "experience-overview",
  },
  {
    name: "technology experience",
    turns: ["Has Zomer used PostgreSQL professionally?"],
    expectedIntent: "experience",
    expectedSourceTypes: ["experience"],
    expectedTerms: ["PostgreSQL"],
  },
  {
    name: "tech stack",
    turns: ["What technologies does Zomer use?"],
    expectedIntent: "techstack",
    expectedSourceTypes: ["techstack", "experience", "project"],
  },
  {
    name: "project",
    turns: ["What AI projects has Zomer built?"],
    expectedIntent: "project",
    expectedSourceTypes: ["project"],
    expectedTerms: ["AI"],
  },
  {
    name: "blog",
    turns: ["Has Zomer written about RAG?"],
    expectedIntent: "blog",
    expectedSourceTypes: ["blog"],
    expectedTerms: ["RAG"],
  },
  {
    name: "latest blog",
    turns: ["What's his latest blog?"],
    expectedIntent: "blog",
    expectedSourceTypes: ["blog"],
    expectedStructuredRetrieval: "latest-blog",
  },
  {
    name: "latest experience",
    turns: ["What's Zomer's most recent professional experience?"],
    expectedIntent: "experience",
    expectedSourceTypes: ["experience"],
    expectedTerms: ["Seansoft Corporation"],
    expectedStructuredRetrieval: "latest-experience",
  },
  {
    name: "multi-turn",
    turns: ["What's his backend experience?", "What about PostgreSQL?"],
    expectedIntent: "experience",
    expectedSourceTypes: ["experience", "project"],
    expectedTerms: ["PostgreSQL"],
  },
  {
    name: "negative evidence",
    turns: ["Does Zomer have professional Rust experience?"],
    expectedIntent: "experience",
    expectedSourceTypes: ["experience", "project"],
    expectedTerms: ["Rust"],
    expectNoEvidence: true,
  },
];
