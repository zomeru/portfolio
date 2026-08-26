import { getSanityEnv } from "@portfolio/env/sanity";
import { getSanityServerEnv } from "@portfolio/env/sanity-server";
import { createClient, type SanityClient } from "@sanity/client";
import type { GeneratedBlogDraft } from "./draft";

const SANITY_API_VERSION = "2026-08-01";

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

export async function createGeneratedBlogPost(input: {
  draft: GeneratedBlogDraft;
  generationKey: string;
  trigger: BlogGenerationTrigger;
}): Promise<PublishedBlogPost> {
  const publishedAt = new Date().toISOString();

  const post = await getWriteClient().create<GeneratedBlogPostFields>({
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
