import { BLOG_CONTENT_LIMITS } from "@portfolio/content/blog";
import { generateText, NoObjectGeneratedError, NoOutputGeneratedError, Output } from "ai";
import { z } from "zod";
import { ApiError } from "../../errors";
import { log } from "../../lib/log";
import { getBlogLanguageModel } from "../ai/models";

const SYSTEM_INSTRUCTION = `You are a principal full-stack software engineer and expert technical writer. Write for experienced software engineers. Be practical, concise, technically credible, and specific. Avoid hype, filler, generic advice, and obvious AI-generated phrasing. Focus on real-world engineering problems, tradeoffs, architecture, and implementation details. Use code only when it materially improves understanding. Prefer TypeScript when code is useful. Return strict JSON only with no extra commentary or Markdown fences.`;

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

const BLOG_DOMAINS = [
  "Application development (web, mobile, desktop, cross-platform, frontend, backend, and fullstack)",
  "Software architecture and systems design (modularity, distributed systems, APIs, messaging, and integration patterns)",
  "AI, machine learning, and data engineering (models, agents, evaluation, retrieval, pipelines, and analytics)",
  "Programming languages and runtimes (language features, compilers, type systems, concurrency, and runtime behavior)",
  "Cloud, platform, and infrastructure engineering (deployment, containers, serverless, edge, networking, and operations)",
  "Developer tooling and engineering productivity (build systems, testing, CI/CD, observability, and local development)",
  "Security, privacy, and identity (application security, authentication, authorization, data protection, and supply chains)",
  "Databases, storage, search, caching, streaming, and data modeling",
  "Performance, scalability, reliability, resilience, and cost efficiency",
  "User experience, accessibility, design systems, rendering, and interaction patterns",
  "Testing, debugging, code quality, maintainability, migrations, and technical debt",
  "Observability, incident response, production operations, and site reliability",
  "Networking, protocols, real-time systems, synchronization, and offline-first design",
  "Open source, developer ecosystems, standards, interoperability, and emerging engineering practices",
] as const;

function pickRandomItem<T>(items: readonly T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];
  if (item === undefined) throw new Error("Cannot select a blog domain from an empty list.");
  return item;
}

function pickBlogDomain(): (typeof BLOG_DOMAINS)[number] {
  return pickRandomItem(BLOG_DOMAINS);
}

const generatePrompt = (): string => {
  const currentDate = new Date().toISOString().slice(0, 10);
  const domain = pickBlogDomain();
  const prompt = `Generate ONE production-ready technical blog post for software engineers.

Context:
- Current date: ${currentDate}
- Optional domain inspiration: ${domain}
- Use your existing technical knowledge only. Do not assume live internet access or invent recent developments, APIs, benchmarks, or releases.

Requirements:
- Choose one specific, practical engineering topic worth writing about.
- Treat the domain as optional inspiration, not a required scope. Choose a better topic or domain if appropriate.
- Focus on one real problem, implementation pattern, migration, tradeoff, debugging scenario, or architectural decision.
- Prefer topics that teach reusable engineering knowledge.
- Avoid broad overviews, generic tutorials, listicles, vague trends, and stale topics.
- Keep tools/frameworks secondary unless one is central to the problem.
- Target ${BLOG_CONTENT_LIMITS.wordCount.minimum}–${BLOG_CONTENT_LIMITS.wordCount.maximum} words.
- Write for working software engineers: practical, technically precise, and concise.
- Explain relevant tradeoffs, constraints, and failure modes.
- Include code only when it materially improves understanding.
- Optimize naturally for SEO without clickbait or keyword stuffing.

Title:
- Maximum ${BLOG_CONTENT_LIMITS.title.maximumCharacters} characters.
- Make it specific, concrete, and search-friendly.
- Start with a clear subject or technology.
- Avoid generic gerund openings such as "Building", "Optimizing", "Architecting" and etc...

Excerpt:
- Write one or two SEO-friendly sentences between ${BLOG_CONTENT_LIMITS.excerpt.minimumCharacters} and ${BLOG_CONTENT_LIMITS.excerpt.maximumCharacters} characters.

Content:
- Markdown body only; do not repeat the title or use an H1.
- Use H2–H3 headings for structure.
- Link the meaningful mention of relevant tools, libraries, or frameworks to official documentation.
- Never invent URLs; omit the link if unsure.

Output:
- Return only the fields defined by the response schema, with no commentary or Markdown fences.
`;

  log("info", "Generating blog content with dynamic topic prompt", { currentDate, domain });
  return prompt;
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

  if (
    wordCount < BLOG_CONTENT_LIMITS.wordCount.acceptedMinimum ||
    wordCount > BLOG_CONTENT_LIMITS.wordCount.acceptedMaximum
  ) {
    throw new ApiError(
      `Generated article contains ${wordCount} words; accepted range is ${BLOG_CONTENT_LIMITS.wordCount.acceptedMinimum}-${BLOG_CONTENT_LIMITS.wordCount.acceptedMaximum} words (target ${BLOG_CONTENT_LIMITS.wordCount.minimum}-${BLOG_CONTENT_LIMITS.wordCount.maximum}).`,
      { code: "BLOG_GENERATION_INVALID", status: 422 },
    );
  }

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

export async function generateBlogDraft(): Promise<GeneratedBlogDraft> {
  const { model, modelId, provider } = getBlogLanguageModel();

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
      temperature: 0.35,
      maxOutputTokens: 8192,
      maxRetries: 2,
      abortSignal: AbortSignal.timeout(60_000),
    });
    const draft = result.output;
    const validation = assertValidDraft(draft);
    const slug = createSlug(draft.title);

    log("info", "blog draft generated", {
      model: modelId,
      provider,
      finishReason: result.finishReason,
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
      errorType: error instanceof Error ? error.name : "UnknownError",
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
