import { propagateAttributes, startActiveObservation } from "@langfuse/tracing";
import {
  acquireBlogGenerationLock,
  refreshBlogGenerationLock,
  releaseBlogGenerationLock,
} from "@portfolio/database";

import { ApiError } from "../../errors";
import { errorLogMetadata, log } from "../../lib/log";
import { EmbeddingContentRejectedError } from "../assistant/embeddings";
import {
  IngestionAlreadyRunningError,
  synchronizePublishedKnowledgeDocument,
} from "../assistant/ingestion";
import { dispatchBlogPublished } from "../notifications/delivery";
import { generateBlogDraft } from "./draft";
import {
  type BlogGenerationTrigger,
  createGeneratedBlogPost,
  findGeneratedBlogPost,
  getBlogGenerationScope,
  listPublishedBlogCorpus,
  type PublishedBlogPost,
} from "./repository";
import { findDuplicateBlogPosts, prepareBlogFingerprints } from "./similarity";

type GenerationResult = {
  created: boolean;
  notifications: {
    eventId?: string;
    status: "failed" | "succeeded";
  };
  indexing: {
    chunksCreated: number;
    status: "failed" | "succeeded" | "unchanged";
  };
  post: PublishedBlogPost;
};

const inFlightGenerations = new Map<string, Promise<GenerationResult>>();
const MAX_DRAFT_ATTEMPTS = 2;
const GENERATION_BUDGET_MS = 4 * 60 * 1_000;

type GenerationRequest = { generationKey: string; trigger: BlogGenerationTrigger };

function generationBusy() {
  return new ApiError("A blog generation is already in progress. Retry in a few minutes.", {
    code: "BLOG_GENERATION_BUSY",
    status: 409,
  });
}

async function publishUniqueDraft(input: GenerationRequest) {
  const scope = getBlogGenerationScope();
  const token = await acquireBlogGenerationLock(scope);
  if (!token) throw generationBusy();

  const signal = AbortSignal.timeout(GENERATION_BUDGET_MS);
  const renewLease = async () => {
    signal.throwIfAborted();
    if (!(await refreshBlogGenerationLock(scope, token))) throw generationBusy();
  };

  try {
    const existing = await findGeneratedBlogPost(input.generationKey);
    if (existing) return { post: existing, created: false };

    const posts = await listPublishedBlogCorpus(signal);
    await prepareBlogFingerprints(scope, posts, signal, renewLease);

    const rejectedTitles: string[] = [];
    for (let attempt = 0; attempt < MAX_DRAFT_ATTEMPTS; attempt++) {
      await renewLease();
      const draft = await generateBlogDraft({
        ...input,
        attempt,
        topics: posts,
        rejectedTitles,
        signal,
      });
      let matches;
      try {
        matches = await findDuplicateBlogPosts(scope, posts, draft, signal);
      } catch (error) {
        if (!(error instanceof EmbeddingContentRejectedError)) throw error;
        rejectedTitles.push(draft.title);
        log("info", "blog draft rejected by the embedding provider", {
          attempt: attempt + 1,
          trigger: input.trigger,
        });
        continue;
      }
      if (matches.length === 0) {
        await renewLease();
        const post = await createGeneratedBlogPost({ ...input, draft });
        return { post, created: true };
      }

      rejectedTitles.push(draft.title, ...matches.map((post) => post.title));
      log("info", "blog draft rejected as duplicate", {
        attempt: attempt + 1,
        matches: matches.map((post) => post.id),
        trigger: input.trigger,
      });
    }
    throw new ApiError("The generated drafts overlap with published articles.", {
      code: "BLOG_GENERATION_DUPLICATE",
      status: 422,
    });
  } finally {
    try {
      await releaseBlogGenerationLock(scope, token);
    } catch (error) {
      log("error", "blog generation lock release failed", {
        ...errorLogMetadata(error, "blogGeneration.releaseLock"),
      });
    }
  }
}

async function dispatchNotifications(
  post: PublishedBlogPost,
  trigger: BlogGenerationTrigger,
): Promise<GenerationResult["notifications"]> {
  try {
    const dispatched = await dispatchBlogPublished({
      id: post._id,
      revision: post._rev,
      title: post.title,
      slug: post.slug.current,
      ...(post.excerpt ? { excerpt: post.excerpt } : {}),
      publishedAt: post.publishedAt,
    });
    return {
      eventId: dispatched.eventId,
      status: dispatched.materializationFailures.length > 0 ? "failed" : "succeeded",
    };
  } catch (error) {
    log("error", "published blog post notification dispatch failed", {
      ...errorLogMetadata(error, "blogGeneration.dispatchNotifications"),
      postId: post._id,
      slug: post.slug.current,
      trigger,
    });
    return { status: "failed" };
  }
}

async function indexPublishedPost(
  post: PublishedBlogPost,
  trigger: BlogGenerationTrigger,
): Promise<GenerationResult["indexing"]> {
  try {
    const summary = await synchronizePublishedKnowledgeDocument({
      documentId: post._id,
      trigger: trigger === "scheduled" ? "scheduled" : "admin",
    });
    return {
      chunksCreated: summary.chunksCreated,
      status: summary.documentsUnchanged > 0 ? "unchanged" : "succeeded",
    };
  } catch (error) {
    log("error", "published blog post indexing failed", {
      ...errorLogMetadata(error, "blogGeneration.indexPublishedPost"),
      indexingAlreadyRunning: error instanceof IngestionAlreadyRunningError,
      postId: post._id,
      slug: post.slug.current,
      trigger,
    });
    return { chunksCreated: 0, status: "failed" };
  }
}

async function generateAndPublish(input: {
  generationKey: string;
  trigger: BlogGenerationTrigger;
}): Promise<GenerationResult> {
  return propagateAttributes(
    {
      traceName: "generate-blog-post",
      tags: ["ai-blog-generation", input.trigger],
      metadata: { trigger: input.trigger, workflow: "blog-generation" },
    },
    () =>
      startActiveObservation("generate-blog-post", async (workflow) => {
        workflow.update({ input: { trigger: input.trigger } });

        try {
          const previous = await findGeneratedBlogPost(input.generationKey);
          const { created, post } = previous
            ? { created: false, post: previous }
            : await publishUniqueDraft(input);
          if (created) {
            log("info", "generated blog post published", {
              postId: post._id,
              slug: post.slug.current,
              trigger: input.trigger,
            });
          }

          const [notifications, indexing] = await Promise.all([
            dispatchNotifications(post, input.trigger),
            indexPublishedPost(post, input.trigger),
          ]);

          const result = { created, indexing, notifications, post };
          workflow.update({
            output: {
              created,
              indexingStatus: indexing.status,
              notificationStatus: notifications.status,
              postId: post._id,
              slug: post.slug.current,
              success: true,
            },
          });
          return result;
        } catch (error) {
          workflow.update({
            level: "ERROR",
            output: {
              errorType: error instanceof Error ? error.name : "UnknownError",
              success: false,
            },
            statusMessage: "Blog generation failed before the workflow completed.",
          });
          throw error;
        }
      }),
  );
}

export function generateAndPublishBlog(input: {
  generationKey: string;
  trigger: BlogGenerationTrigger;
}) {
  const current = inFlightGenerations.get(input.generationKey);
  if (current) return current;

  const generation = generateAndPublish(input).finally(() => {
    inFlightGenerations.delete(input.generationKey);
  });
  inFlightGenerations.set(input.generationKey, generation);
  return generation;
}

export function generateScheduledBlog(scheduledTime: number) {
  const date = new Date(scheduledTime).toISOString().slice(0, 10);
  return generateAndPublishBlog({ generationKey: `scheduled:${date}`, trigger: "scheduled" });
}
