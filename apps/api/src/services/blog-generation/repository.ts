import { createHash } from "node:crypto";

import { getSanityEnv } from "@portfolio/env/sanity";
import { getSanityServerEnv } from "@portfolio/env/sanity-server";
import { createClient, type SanityClient } from "@sanity/client";
import { z } from "zod";

import type { GeneratedBlogDraft } from "./draft";

const SANITY_API_VERSION = "2026-08-01";
const SANITY_REQUEST_TIMEOUT_MS = 30_000;
const CORPUS_PAGE_SIZE = 50;

export type BlogGenerationTrigger = "manual" | "scheduled";

export type PublishedBlogPost = {
  _id: string;
  _rev: string;
  excerpt?: string;
  publishedAt: string;
  slug: { _type: "slug"; current: string };
  title: string;
};

type GeneratedBlogPostFields = {
  _type: "blogPost";
  body: string;
  excerpt: string;
  generation: {
    generatedAt: string;
    key: string;
    model: string;
    provider: string;
    trigger: BlogGenerationTrigger;
  };
  publishedAt: string;
  readTime: number;
  slug: { _type: "slug"; current: string };
  source: "assisted" | "automated";
  tags: string[];
  title: string;
};

let writeClient: SanityClient | undefined;

export function getBlogGenerationScope() {
  const { projectId, dataset } = getSanityEnv();
  return `${projectId}:${dataset}`;
}

function getWriteClient(): SanityClient {
  if (writeClient) return writeClient;

  const sanity = getSanityEnv();
  const server = getSanityServerEnv();

  writeClient = createClient({
    apiVersion: SANITY_API_VERSION,
    dataset: sanity.dataset,
    perspective: "published",
    projectId: sanity.projectId,
    token: server.token,
    timeout: SANITY_REQUEST_TIMEOUT_MS,
    // Generation controls the lease and idempotency key for each publication.
    maxRetries: 0,
    useCdn: false,
  });

  return writeClient;
}

export async function findGeneratedBlogPost(
  generationKey: string,
): Promise<PublishedBlogPost | null> {
  return getWriteClient().fetch<PublishedBlogPost | null>(
    `*[_type == "blogPost" && generation.key == $generationKey][0] {
      _id,
      _rev,
      title,
      slug,
      publishedAt,
      excerpt
    }`,
    { generationKey },
  );
}

const publishedBlogCorpusEntry = z.object({
  id: z.string(),
  revision: z.string(),
  publishedAt: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  tags: z.array(z.string()),
  body: z.string(),
});

export type PublishedBlogCorpusEntry = z.infer<typeof publishedBlogCorpusEntry>;

export async function listPublishedBlogCorpus(signal: AbortSignal) {
  const posts: PublishedBlogCorpusEntry[] = [];
  let after = "";
  for (;;) {
    const raw = await getWriteClient().fetch<unknown>(
      `*[_type == "blogPost" && defined(slug.current) && defined(publishedAt) && _id > $after]
        | order(_id asc)[0...${CORPUS_PAGE_SIZE}] {
          "id": _id, "revision": _rev, publishedAt, title, "slug": slug.current,
          "excerpt": coalesce(excerpt, ""), "tags": coalesce(tags, []),
          "body": coalesce(body, "")
        }`,
      { after },
      { signal },
    );
    const page = publishedBlogCorpusEntry.array().parse(raw);
    posts.push(...page);
    if (page.length < CORPUS_PAGE_SIZE) {
      return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    }
    after = page.at(-1)?.id ?? after;
  }
}

export async function createGeneratedBlogPost(input: {
  draft: GeneratedBlogDraft;
  generationKey: string;
  trigger: BlogGenerationTrigger;
}): Promise<PublishedBlogPost> {
  const publishedAt = new Date().toISOString();

  const id = createHash("sha256").update(input.generationKey).digest("hex");
  const post = await getWriteClient().createIfNotExists<GeneratedBlogPostFields>({
    _id: `generated-blog-${id}`,
    _type: "blogPost",
    title: input.draft.title,
    slug: { _type: "slug", current: input.draft.slug },
    excerpt: input.draft.excerpt,
    body: input.draft.body,
    publishedAt,
    tags: input.draft.tags,
    source: input.trigger === "scheduled" ? "automated" : "assisted",
    readTime: input.draft.readTime,
    generation: {
      provider: input.draft.provider,
      model: input.draft.model,
      key: input.generationKey,
      trigger: input.trigger,
      generatedAt: publishedAt,
    },
  });

  return {
    _id: post._id,
    _rev: post._rev,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    slug: post.slug,
    title: post.title,
  };
}
