import {
  findSimilarBlogFingerprints,
  listBlogFingerprintRevisions,
  writeBlogFingerprints,
} from "@portfolio/database";

import { EmbeddingContentRejectedError, embedKnowledgeChunks } from "../assistant/embeddings";
import type { GeneratedBlogDraft } from "./draft";
import type { PublishedBlogCorpusEntry } from "./repository";

type Article = Pick<PublishedBlogCorpusEntry, "title" | "slug" | "excerpt" | "body" | "tags">;

const CORPUS_EMBEDDING_BATCH_SIZE = 8;
const BODY_EMBEDDING_CHARACTERS = 14_000;
const MAXIMUM_TOPIC_DISTANCE = 0.1;
const MAXIMUM_BODY_DISTANCE = 0.12;

function titleKey(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function wordSequence(value: string) {
  return (
    value
      .normalize("NFKC")
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

function shingles(value: string) {
  const words = wordSequence(value);
  return new Set(
    words.slice(2).map((word, index) => `${words[index]} ${words[index + 1]} ${word}`),
  );
}

function overlap(left: Set<string>, right: Set<string>) {
  const common = [...left].filter((item) => right.has(item)).length;
  return common / (left.size + right.size - common);
}

function headings(body: string) {
  const prose = body.replace(/^`{3,}[^\n]*\n[\s\S]*?^`{3,}\s*$/gm, "");
  return [...prose.matchAll(/^#{2,3}\s+(.+)$/gm)].map(([, heading]) => heading ?? "");
}

export function sharesTitleOrOutline(left: Article, right: Article) {
  if (left.slug === right.slug || titleKey(left.title) === titleKey(right.title)) return true;
  const firstTopic = shingles(`${left.title} ${left.excerpt}`);
  const secondTopic = shingles(`${right.title} ${right.excerpt}`);
  if (firstTopic.size >= 8 && secondTopic.size >= 8 && overlap(firstTopic, secondTopic) >= 0.65) {
    return true;
  }

  const leftHeadings = new Set(
    headings(left.body)
      .map(titleKey)
      .filter((text) => text.length >= 12),
  );
  const rightHeadings = new Set(
    headings(right.body)
      .map(titleKey)
      .filter((text) => text.length >= 12),
  );
  if (leftHeadings.size < 3 || rightHeadings.size < 3) return false;
  return overlap(leftHeadings, rightHeadings) >= 0.75;
}

function embeddingInputs(post: Article): [string, string] {
  const outline = headings(post.body).slice(0, 10).join("\n");
  return [
    [post.title, post.excerpt, post.tags.join(", "), outline].join("\n"),
    [post.title, post.excerpt, post.body.slice(0, BODY_EMBEDDING_CHARACTERS)].join("\n"),
  ];
}

function fingerprint(vectors: number[][], index: number) {
  const topic = vectors[index * 2];
  const body = vectors[index * 2 + 1];
  if (!topic || !body) throw new Error("The provider returned an incomplete blog fingerprint.");
  return { topic, body };
}

export async function prepareBlogFingerprints(
  scope: string,
  posts: PublishedBlogCorpusEntry[],
  signal: AbortSignal,
  renewLease: () => Promise<void>,
) {
  const previous = new Map(
    (await listBlogFingerprintRevisions(scope)).map((post) => [post.documentId, post.revision]),
  );
  const changed = posts.filter((post) => previous.get(post.id) !== post.revision);
  for (let index = 0; index < changed.length; index += CORPUS_EMBEDDING_BATCH_SIZE) {
    signal.throwIfAborted();
    const postsToEmbed = changed.slice(index, index + CORPUS_EMBEDDING_BATCH_SIZE);
    const vectors = await embedKnowledgeChunks(postsToEmbed.flatMap(embeddingInputs), {
      signal,
    }).catch((error: unknown) => {
      if (!(error instanceof EmbeddingContentRejectedError)) throw error;
      return null;
    });
    await renewLease();
    await writeBlogFingerprints(
      scope,
      postsToEmbed.map((post, index) => ({
        documentId: post.id,
        revision: post.revision,
        ...(vectors ? fingerprint(vectors, index) : { topic: null, body: null }),
      })),
    );
  }
}

export async function findDuplicateBlogPosts(
  scope: string,
  posts: PublishedBlogCorpusEntry[],
  draft: GeneratedBlogDraft,
  signal: AbortSignal,
) {
  const draftBody = shingles(draft.body);
  const matches = posts
    .filter((post) => {
      if (sharesTitleOrOutline(post, draft)) return true;
      return draftBody.size >= 100 && overlap(draftBody, shingles(post.body)) >= 0.45;
    })
    .slice(0, 3);
  if (matches.length || posts.length === 0) return matches;

  const vectors = await embedKnowledgeChunks(embeddingInputs(draft), { signal });
  const similar = await findSimilarBlogFingerprints({
    scope,
    documentIds: posts.map((post) => post.id),
    ...fingerprint(vectors, 0),
    maximumTopicDistance: MAXIMUM_TOPIC_DISTANCE,
    maximumBodyDistance: MAXIMUM_BODY_DISTANCE,
  });
  const matchIds = new Set(similar.map((post) => post.documentId));
  return posts.filter((post) => matchIds.has(post.id));
}
