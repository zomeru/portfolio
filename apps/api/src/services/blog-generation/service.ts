import { propagateAttributes, startActiveObservation } from "@langfuse/tracing";
import { ApiError } from "../../errors";
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
  getGenerationContext,
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

function normalizeTitle(value: string) {
  return (
    value
      .normalize("NFKD")
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu)
      ?.join(" ") ?? ""
  );
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
          const initialContext = await getGenerationContext(input.generationKey);
          let created = false;
          let post = initialContext.existing;

          if (!post) {
            const draft = await generateBlogDraft(input.trigger);
            const refreshedContext = await getGenerationContext(input.generationKey);
            post = refreshedContext.existing;

            if (!post) {
              const duplicate = refreshedContext.identifiers.find(
                (identifier) =>
                  identifier.slug === draft.slug ||
                  normalizeTitle(identifier.title) === normalizeTitle(draft.title),
              );

              if (duplicate) {
                throw new ApiError("The generated article duplicates an existing post.", {
                  code: "BLOG_DUPLICATE",
                  status: 409,
                });
              }

              post = await createGeneratedBlogPost({ ...input, draft });
              created = true;
              log("info", "generated blog post published", {
                postId: post._id,
                slug: post.slug.current,
                trigger: input.trigger,
              });
            }
          }

          let notifications: GenerationResult["notifications"];
          try {
            const dispatched = await dispatchBlogPublished({
              id: post._id,
              revision: post._rev,
              title: post.title,
              slug: post.slug.current,
              ...(post.excerpt ? { excerpt: post.excerpt } : {}),
              publishedAt: post.publishedAt,
            });
            notifications = {
              eventId: dispatched.eventId,
              status: dispatched.materializationFailures.length > 0 ? "failed" : "succeeded",
            };
          } catch (error) {
            notifications = { status: "failed" };
            log("error", "published blog post notification dispatch failed", {
              ...errorLogMetadata(error, "blogGeneration.dispatchNotifications"),
              postId: post._id,
              slug: post.slug.current,
              trigger: input.trigger,
            });
          }

          let indexing: GenerationResult["indexing"];
          try {
            const summary = await synchronizePublishedKnowledgeDocument({
              documentId: post._id,
              trigger: input.trigger === "scheduled" ? "scheduled" : "admin",
            });
            indexing = {
              chunksCreated: summary.chunksCreated,
              status: summary.documentsUnchanged > 0 ? "unchanged" : "succeeded",
            };
          } catch (error) {
            indexing = { chunksCreated: 0, status: "failed" };
            log("error", "published blog post indexing failed", {
              ...errorLogMetadata(error, "blogGeneration.indexPublishedPost"),
              indexingAlreadyRunning: error instanceof IngestionAlreadyRunningError,
              postId: post._id,
              slug: post.slug.current,
              trigger: input.trigger,
            });
          }

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
