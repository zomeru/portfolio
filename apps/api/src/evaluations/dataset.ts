import type { KnowledgeSourceType, QueryIntent } from "../types";

export type EvaluationCase = {
  category:
    | "ambiguous"
    | "blog"
    | "cross-document"
    | "direct-fact"
    | "experience"
    | "follow-up"
    | "general"
    | "keyword"
    | "no-answer"
    | "project"
    | "semantic"
    | "technology";
  name: string;
  turns: string[];
  expectedIntent: QueryIntent;
  expectedSourceTypes: KnowledgeSourceType[];
  expectedTerms?: string[];
  expectedKeywordTerms?: string[];
  expectedNamedTerms?: string[];
  expectedSemanticTerms?: string[];
  expectNoEvidence?: boolean;
  expectedStructuredRetrieval?:
    | "blog-filter-list"
    | "blog-count"
    | "company-count"
    | "latest-blog"
    | "oldest-blog"
    | "oldest-blogs"
    | "recent-blogs"
    | "latest-experience"
    | "oldest-experience"
    | "experience-overview";
};

export const evaluationDataset: EvaluationCase[] = [
  {
    category: "general",
    name: "general technical question",
    turns: ["What is React?"],
    expectedIntent: "general",
    expectedSourceTypes: [],
  },
  {
    category: "direct-fact",
    name: "profile role",
    turns: ["What is Zomer's role?"],
    expectedIntent: "profile",
    expectedSourceTypes: ["profile"],
    expectedTerms: ["Software Engineer"],
    expectedKeywordTerms: ["role"],
  },
  {
    category: "experience",
    name: "experience by company",
    turns: ["What did Zomer do at Seansoft?"],
    expectedIntent: "experience",
    expectedSourceTypes: ["experience"],
    expectedTerms: ["Seansoft Corporation"],
    expectedKeywordTerms: ["Seansoft"],
    expectedNamedTerms: ["Seansoft"],
  },
  {
    category: "experience",
    name: "experience overview",
    turns: ["Tell me about Zomer's experience. Just a summary."],
    expectedIntent: "experience",
    expectedSourceTypes: ["experience"],
    expectedTerms: ["Seansoft Corporation"],
    expectedStructuredRetrieval: "experience-overview",
  },
  {
    category: "technology",
    name: "technology experience",
    turns: ["Has Zomer used PostgreSQL professionally?"],
    expectedIntent: "experience",
    expectedSourceTypes: ["experience", "project"],
    expectedTerms: ["PostgreSQL"],
    expectedKeywordTerms: ["PostgreSQL"],
    expectedNamedTerms: ["PostgreSQL"],
  },
  {
    category: "technology",
    name: "technology overview",
    turns: ["What technologies does Zomer use?"],
    expectedIntent: "techstack",
    expectedSourceTypes: ["techstack", "experience", "project"],
  },
  {
    category: "project",
    name: "project lookup",
    turns: ["What AI projects has Zomer built?"],
    expectedIntent: "project",
    expectedSourceTypes: ["project"],
    expectedTerms: ["Rezumer AI"],
    expectedNamedTerms: ["AI"],
  },
  {
    category: "semantic",
    name: "semantic project paraphrase",
    turns: ["Which tool has Zomer made to improve resumes for job seekers?"],
    expectedIntent: "project",
    expectedSourceTypes: ["project", "experience"],
    expectedTerms: ["Rezumer AI"],
  },
  {
    category: "blog",
    name: "blog topic",
    turns: ["Has Zomer written about reciprocal rank fusion for RAG?"],
    expectedIntent: "blog",
    expectedSourceTypes: ["blog"],
    expectedTerms: ["Reciprocal Rank Fusion"],
    expectedNamedTerms: ["RAG"],
  },
  {
    category: "blog",
    name: "latest blog",
    turns: ["What's his latest blog?"],
    expectedIntent: "blog",
    expectedSourceTypes: ["blog"],
    expectedStructuredRetrieval: "latest-blog",
  },
  {
    category: "blog",
    name: "oldest blog with typo",
    turns: ["What's oldes Zomer blog?"],
    expectedIntent: "blog",
    expectedSourceTypes: ["blog"],
    expectedStructuredRetrieval: "oldest-blog",
  },
  {
    category: "blog",
    name: "oldest blog list with dynamic count",
    turns: ["List Zomer's five oldest blogs"],
    expectedIntent: "blog",
    expectedSourceTypes: ["blog"],
    expectedStructuredRetrieval: "oldest-blogs",
  },
  {
    category: "blog",
    name: "recent blog list",
    turns: ["What's Zomer recent blogs?"],
    expectedIntent: "blog",
    expectedSourceTypes: ["blog"],
    expectedStructuredRetrieval: "recent-blogs",
  },
  {
    category: "blog",
    name: "total blog count",
    turns: ["How blogs does Zomer have?"],
    expectedIntent: "blog",
    expectedSourceTypes: ["blog"],
    expectedStructuredRetrieval: "blog-count",
  },
  {
    category: "experience",
    name: "latest experience",
    turns: ["What's Zomer's most recent professional experience?"],
    expectedIntent: "experience",
    expectedSourceTypes: ["experience"],
    expectedTerms: ["Seansoft Corporation"],
    expectedStructuredRetrieval: "latest-experience",
  },
  {
    category: "experience",
    name: "oldest experience temporal follow-up",
    turns: ["What's Zomer's recent work experience?", "oldest work experience?"],
    expectedIntent: "experience",
    expectedSourceTypes: ["experience"],
    expectedTerms: ["Freelance"],
    expectedStructuredRetrieval: "oldest-experience",
  },
  {
    category: "experience",
    name: "distinct company count",
    turns: ["How many companies does Zomer have worked for?"],
    expectedIntent: "experience",
    expectedSourceTypes: ["experience"],
    expectedStructuredRetrieval: "company-count",
  },
  {
    category: "blog",
    name: "blogs filtered by named technology",
    turns: ["Which Zomer's blog mentions Next.js?"],
    expectedIntent: "blog",
    expectedSourceTypes: ["blog"],
    expectedKeywordTerms: ["Next.js"],
    expectedNamedTerms: ["Next.js"],
    expectedStructuredRetrieval: "blog-filter-list",
  },
  {
    category: "follow-up",
    name: "experience follow-up",
    turns: ["What's his backend experience?", "What about PostgreSQL?"],
    expectedIntent: "experience",
    expectedSourceTypes: ["experience", "project"],
    expectedTerms: ["PostgreSQL"],
    expectedKeywordTerms: ["PostgreSQL"],
    expectedNamedTerms: ["PostgreSQL"],
    expectedSemanticTerms: ["Previous question", "backend experience"],
  },
  {
    category: "follow-up",
    name: "project pronoun follow-up",
    turns: ["What projects has Zomer built?", "Which one used PostgreSQL?"],
    expectedIntent: "project",
    expectedSourceTypes: ["project", "experience"],
    expectedTerms: ["Rezumer AI"],
    expectedKeywordTerms: ["PostgreSQL"],
    expectedNamedTerms: ["PostgreSQL"],
    expectedSemanticTerms: ["Previous question", "projects"],
  },
  {
    category: "keyword",
    name: "keyword-heavy company query",
    turns: ["Zomer Seansoft PostgreSQL Celery"],
    expectedIntent: "portfolio",
    expectedSourceTypes: ["experience", "profile", "project", "blog", "techstack"],
    expectedTerms: ["Seansoft Corporation", "PostgreSQL", "Celery"],
    expectedKeywordTerms: ["Seansoft", "PostgreSQL", "Celery"],
    expectedNamedTerms: ["Seansoft", "PostgreSQL", "Celery"],
  },
  {
    category: "cross-document",
    name: "mixed recommendation and portfolio evidence",
    turns: [
      "Does Zomer have experience with technologies you would recommend for building a SaaS?",
    ],
    expectedIntent: "experience",
    expectedSourceTypes: ["experience", "project", "profile"],
    expectedTerms: ["React", "PostgreSQL"],
  },
  {
    category: "ambiguous",
    name: "ambiguous portfolio question",
    turns: ["What has Zomer done?"],
    expectedIntent: "portfolio",
    expectedSourceTypes: ["profile", "experience", "project", "blog", "techstack"],
  },
  {
    category: "no-answer",
    name: "unsupported technology",
    turns: ["Does Zomer have professional Rust experience?"],
    expectedIntent: "experience",
    expectedSourceTypes: ["experience", "project"],
    expectedTerms: ["Rust"],
    expectedKeywordTerms: ["Rust"],
    expectedNamedTerms: ["Rust"],
    expectNoEvidence: true,
  },
  {
    category: "general",
    name: "general RAG question",
    turns: ["How does retrieval-augmented generation work?"],
    expectedIntent: "general",
    expectedSourceTypes: [],
  },
];
