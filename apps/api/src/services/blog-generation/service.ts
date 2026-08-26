import { propagateAttributes, startActiveObservation } from "@langfuse/tracing";

import { errorLogMetadata, log } from "../../lib/log";
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
  type PublishedBlogPost,
} from "./repository";

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
          let created = false;
          let post = await findGeneratedBlogPost(input.generationKey);

          if (!post) {
            const draft = await generateBlogDraft(input.trigger);
            post = await createGeneratedBlogPost({ ...input, draft });
            created = true;
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
