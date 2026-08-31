import { BLOG_CONTENT_LIMITS } from "@portfolio/content/blog";
import { generateText, NoObjectGeneratedError, NoOutputGeneratedError, Output } from "ai";
import { z } from "zod";

import { ApiError } from "../../errors";
import { errorLogMetadata, log } from "../../lib/log";
import { getBlogLanguageModel } from "../ai/models";
import type { BlogGenerationTrigger } from "./repository";

const SYSTEM_INSTRUCTION = `You are a principal full-stack software engineer and expert technical writer. Write for experienced software engineers. Be practical, concise, technically credible, and specific. Avoid hype, filler, generic advice, and obvious AI-generated phrasing. Focus on real-world engineering problems, tradeoffs, architecture, and implementation details. Use code only when it materially improves understanding. Prefer TypeScript when code is useful. Return strict JSON only with no extra commentary or Markdown fences.`;
const BLOG_GENERATION_TIMEOUT_MS = 60_000;
const BLOG_GENERATION_MAX_RETRIES = 0;
const BLOG_GENERATION_CHARACTERS_PER_TOKEN = 4;
const BLOG_GENERATION_JSON_TOKEN_BUFFER = 256;
const BLOG_GENERATION_MAX_OUTPUT_TOKENS =
  Math.ceil(
    (BLOG_CONTENT_LIMITS.body.maximumCharacters +
      BLOG_CONTENT_LIMITS.excerpt.maximumCharacters +
      BLOG_CONTENT_LIMITS.title.maximumCharacters +
      BLOG_CONTENT_LIMITS.tags.maximumItems * BLOG_CONTENT_LIMITS.tags.maximumCharacters) /
      BLOG_GENERATION_CHARACTERS_PER_TOKEN,
  ) + BLOG_GENERATION_JSON_TOKEN_BUFFER;

const BLOG_DOMAINS = [
  // Full-stack web development
  "Modern full-stack web architecture with React, Next.js, TypeScript, and Node.js",
  "Server and client boundaries, React Server Components, rendering, streaming, and caching",
  "Backend API design with Node.js, Hono, Express, REST, OpenAPI, and type-safe contracts",
  "Authentication, authorization, sessions, API security, rate limiting, and application security",
  "PostgreSQL data modeling, query optimization, transactions, indexing, and database migrations",
  "Caching, queues, background jobs, webhooks, event-driven architecture, and asynchronous workflows",
  "Real-time applications with WebSockets, Server-Sent Events, synchronization, and optimistic updates",
  "Frontend state management, server state, forms, validation, and complex application data flows",
  "Web performance, Core Web Vitals, rendering performance, bundle optimization, and perceived speed",
  "Web accessibility, responsive UI, design systems, interaction patterns, and progressive enhancement",

  // Mobile and cross-platform development
  "Cross-platform mobile development with React Native, Expo, and shared TypeScript architecture",
  "Mobile application architecture, navigation, state management, persistence, and offline-first design",
  "Mobile-to-backend integration, authentication, push notifications, deep links, and real-time features",
  "Offline synchronization, local-first applications, conflict resolution, and resilient mobile data flows",
  "Mobile performance, platform-specific behavior, native integrations, and cross-platform tradeoffs",

  // Architecture, infrastructure, and production
  "Full-stack application architecture, modular monoliths, service boundaries, and distributed system tradeoffs",
  "Docker, containers, serverless, edge runtimes, deployment architecture, and cloud portability",
  "CI/CD, infrastructure as code, automated deployments, environment management, and release engineering",
  "Testing full-stack applications with unit, integration, end-to-end, contract, and production verification",
  "Observability, structured logging, tracing, metrics, debugging, incident response, and production reliability",
  "Scalability, resilience, concurrency, performance engineering, and infrastructure cost optimization",

  // AI application engineering
  "Building production AI features with LLM APIs, structured outputs, streaming, and model abstraction",
  "AI agents, tool calling, multi-step workflows, agent orchestration, and autonomous task execution",
  "AI coding agents, coding harnesses, repository context, agent workflows, and human review",
  "RAG systems, embeddings, hybrid search, reranking, chunking, retrieval quality, and grounded generation",
  "AI evaluation, benchmarks, regression testing, observability, tracing, and production quality measurement",
  "Model routing, fallback strategies, latency, token usage, caching, and AI inference cost optimization",
  "MCP, agent tools, API discovery, structured tool interfaces, and agent-accessible applications",
  "AI security, prompt injection, tool permissions, data privacy, guardrails, and untrusted model output",
  "AI-assisted software development, agent-ready repositories, documentation, context engineering, and workflows",
  "Human-in-the-loop AI systems, approval workflows, confidence thresholds, and safe automation",
] as const;

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = result[i];
    const random = result[j];

    if (current === undefined || random === undefined) continue;

    result[i] = random;
    result[j] = current;
  }

  return result;
}

function createRandomPicker<T>(items: readonly T[]) {
  if (items.length === 0) throw new Error("Cannot create a picker from an empty list.");

  let queue = shuffle(items);

  return (): T => {
    if (queue.length === 0) queue = shuffle(items);

    const item = queue.pop();
    if (item === undefined) throw new Error("Failed to select an item.");

    return item;
  };
}

const pickBlogDomain = createRandomPicker(BLOG_DOMAINS);

const generatedBlogSchema = z.object({
  title: z
    .string()
    .trim()
    .min(BLOG_CONTENT_LIMITS.title.minimumCharacters)
    .max(BLOG_CONTENT_LIMITS.title.maximumCharacters)
    .describe("Concrete, SEO-friendly article title without clickbait"),
  excerpt: z
    .string()
    .trim()
    .min(BLOG_CONTENT_LIMITS.excerpt.minimumCharacters)
    .max(BLOG_CONTENT_LIMITS.excerpt.maximumCharacters)
    .describe("One or two specific sentences describing the article's practical value"),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(BLOG_CONTENT_LIMITS.tags.minimumCharacters)
        .max(BLOG_CONTENT_LIMITS.tags.maximumCharacters),
    )
    .min(BLOG_CONTENT_LIMITS.tags.minimumItems)
    .max(BLOG_CONTENT_LIMITS.tags.maximumItems)
    .describe("Three to five concise software-engineering topics"),
  content: z
    .string()
    .trim()
    .min(BLOG_CONTENT_LIMITS.body.minimumCharacters)
    .max(BLOG_CONTENT_LIMITS.body.maximumCharacters)
    .describe("Complete Markdown body using H2 and H3 headings, without a title or H1"),
});

export type GeneratedBlogDraft = Omit<z.infer<typeof generatedBlogSchema>, "content"> & {
  body: string;
  model: string;
  provider: string;
  readTime: number;
  slug: string;
};

const generatePrompt = (): string => {
  const domain = pickBlogDomain();

  return `
Context:
* Current date: ${new Date().toISOString().slice(0, 10)}
* Optional domain inspiration: ${domain}
* Use existing technical knowledge only. Do not assume live internet access or invent current releases, APIs, benchmarks, statistics, documentation, or URLs.

Goal:
Create a technically strong, publication-ready article that answers one clear engineering search intent and is genuinely useful to working software engineers.

Topic & Search Intent:
* Choose one specific problem, implementation pattern, migration, debugging scenario, tradeoff, architectural decision, or technical question.
* Treat the provided domain as optional inspiration, not a required scope. Choose a better topic when it produces a stronger article.
* Prefer focused, reusable engineering knowledge over broad overviews, generic tutorials, listicles, trends, or news.
* Internally identify the primary search query, reader intent, core subject, and relevant supporting concepts.
* Build the title, opening, headings, and body around that intent without keyword stuffing or artificial repetition.

Title & Excerpt:
* Write a concrete, descriptive, search-friendly title no longer than ${BLOG_CONTENT_LIMITS.title.maximumCharacters} characters.
* Put the primary subject near the beginning. Avoid clickbait, vague promises, unnecessary superlatives, and generic gerund openings.
* Favor natural title patterns such as:
  * "How to ..."
  * "[Technology]: How to ..."
  * "[Technology]: [Specific Problem or Solution]"
  * "[Technology A] vs. [Technology B] for [Specific Use Case]"
  * "Why [Technical Problem] Happens and How to Fix It"
* Use these patterns only when they accurately match the article.
* Write a distinct one- or two-sentence excerpt between ${BLOG_CONTENT_LIMITS.excerpt.minimumCharacters} and ${BLOG_CONTENT_LIMITS.excerpt.maximumCharacters} characters that states the problem and practical value.

Content & Technical Depth:
* Return a Markdown body without repeating the title or using an H1. Use descriptive H2 and H3 headings with a logical reading order.
* Keep the complete Markdown body between ${BLOG_CONTENT_LIMITS.body.minimumCharacters} and ${BLOG_CONTENT_LIMITS.body.maximumCharacters} characters, including headings, code blocks, and links.
* Establish the problem quickly, answer the main question directly, then explain implementation, tradeoffs, constraints, assumptions, failure modes, edge cases, security, performance, operations, verification, and alternatives where relevant.
* Keep paragraphs focused. Prefer precise technical language over marketing language.
* Include minimal, realistic, internally consistent code only when it materially improves understanding. Prefer TypeScript when appropriate and explain important details.
* Avoid filler, topic drift, unnecessary abstractions, forced FAQs, and repetitive conclusions.

Links & Quality:
* Link meaningful first mentions to official documentation only when confident the URL is correct. Never invent or guess a URL.
* Keep the title, excerpt, headings, examples, and recommendations consistent with the same primary intent.
* Before returning, silently check structure, technical credibility, useful depth, natural SEO language, unsupported claims, and schema compliance. Revise internally when needed.

Output:
* Return only the fields defined by the response schema, with concise relevant tags.
* Do not add commentary or Markdown fences around the response.

`;
};

function countWords(value: string) {
  return value.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)?.length ?? 0;
}

function withoutFencedCodeBlocks(value: string) {
  let fence: { character: "`" | "~"; length: number } | undefined;

  return value
    .split("\n")
    .map((line) => {
      const marker = line.match(/^ {0,3}(`{3,}|~{3,})/u)?.[1];

      if (!fence && marker) {
        fence = { character: marker[0] as "`" | "~", length: marker.length };
        return "";
      }

      if (fence) {
        if (
          marker &&
          marker[0] === fence.character &&
          marker.length >= fence.length &&
          line.slice(marker.length).trim() === ""
        ) {
          fence = undefined;
        }
        return "";
      }

      return line;
    })
    .join("\n");
}

function createSlug(title: string) {
  const normalizedSlug = title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const wordBoundary = normalizedSlug.lastIndexOf("-", BLOG_CONTENT_LIMITS.slug.maximumCharacters);
  const slug =
    normalizedSlug.length <= BLOG_CONTENT_LIMITS.slug.maximumCharacters
      ? normalizedSlug
      : normalizedSlug
          .slice(
            0,
            wordBoundary >= BLOG_CONTENT_LIMITS.slug.minimumCharacters
              ? wordBoundary
              : BLOG_CONTENT_LIMITS.slug.maximumCharacters,
          )
          .replace(/-+$/g, "");

  if (slug.length < BLOG_CONTENT_LIMITS.slug.minimumCharacters) {
    throw new ApiError("Generated title cannot produce a valid SEO slug.", {
      code: "BLOG_GENERATION_INVALID",
      status: 422,
    });
  }

  return slug;
}

function assertValidDraft(draft: z.infer<typeof generatedBlogSchema>) {
  const normalizedBody = draft.content
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const wordCount = countWords(normalizedBody);
  const normalizedTags = draft.tags.map((tag) => tag.trim());
  const uniqueTags = new Set(normalizedTags.map((tag) => tag.toLowerCase()));
  const prose = withoutFencedCodeBlocks(normalizedBody);

  if (/^#\s+/m.test(prose) || /^---\s*$/m.test(prose)) {
    throw new ApiError("Generated article contains unsupported Markdown structure.", {
      code: "BLOG_GENERATION_INVALID",
      status: 422,
    });
  }

  if (uniqueTags.size !== normalizedTags.length) {
    throw new ApiError("Generated article contains duplicate tags.", {
      code: "BLOG_GENERATION_INVALID",
      status: 422,
    });
  }

  if (
    /\b(you won'?t believe|ultimate guide|game[- ]changing|secret(?:s)? to)\b/i.test(draft.title)
  ) {
    throw new ApiError("Generated title is clickbait.", {
      code: "BLOG_GENERATION_INVALID",
      status: 422,
    });
  }

  return {
    body: normalizedBody,
    readTime: Math.max(
      BLOG_CONTENT_LIMITS.readTime.minimumMinutes,
      Math.ceil(wordCount / BLOG_CONTENT_LIMITS.readTime.wordsPerMinute),
    ),
  };
}

export async function generateBlogDraft(
  trigger: BlogGenerationTrigger,
): Promise<GeneratedBlogDraft> {
  const { model, modelId, provider } = getBlogLanguageModel();
  const startedAt = performance.now();

  try {
    const result = await generateText({
      model,
      output: Output.object({
        name: "TechnicalBlogDraft",
        description: "A practical, publication-ready software-engineering article",
        schema: generatedBlogSchema,
      }),
      system: SYSTEM_INSTRUCTION,
      prompt: generatePrompt(),
      temperature: 0.7,
      reasoning: "none",
      maxOutputTokens: BLOG_GENERATION_MAX_OUTPUT_TOKENS,
      maxRetries: BLOG_GENERATION_MAX_RETRIES,
      timeout: BLOG_GENERATION_TIMEOUT_MS,
      runtimeContext: {
        model: modelId,
        provider,
        trigger,
        workflow: "blog-generation",
      },
      telemetry: {
        functionId: "blog-generation.generate-draft",
        includeRuntimeContext: {
          model: true,
          provider: true,
          trigger: true,
          workflow: true,
        },
        recordInputs: true,
        recordOutputs: true,
      },
    });
    const draft = result.output;
    const validation = assertValidDraft(draft);
    const slug = createSlug(draft.title);

    log("info", "blog draft generated", {
      model: modelId,
      provider,
      finishReason: result.finishReason,
      durationMs: Math.round(performance.now() - startedAt),
      wordCount: countWords(validation.body),
    });

    return {
      title: draft.title,
      slug,
      excerpt: draft.excerpt,
      tags: draft.tags,
      body: validation.body,
      model: modelId,
      provider,
      readTime: validation.readTime,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;

    log("error", "blog draft generation failed", {
      model: modelId,
      provider,
      durationMs: Math.round(performance.now() - startedAt),
      timeoutMs: BLOG_GENERATION_TIMEOUT_MS,
      maxRetries: BLOG_GENERATION_MAX_RETRIES,
      timedOut: error instanceof Error && error.name === "TimeoutError",
      ...errorLogMetadata(error, "blogGeneration.generateDraft"),
      structuredOutputFailure:
        NoObjectGeneratedError.isInstance(error) || NoOutputGeneratedError.isInstance(error),
    });

    throw new ApiError("The AI provider could not produce a valid blog draft.", {
      code: "BLOG_GENERATION_FAILED",
      status: 502,
      cause: error,
    });
  }
}
