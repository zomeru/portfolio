import { createHash } from "node:crypto";
import {
  completeIngestionRun,
  createIngestionRun,
  deleteKnowledgeDocumentsNotIn,
  expireStaleIngestionRuns,
  failIngestionRun,
  listIndexedKnowledgeDocuments,
  listRecentIngestionRuns,
  readKnowledgeIndexStatus,
  replaceIndexedKnowledgeDocument,
  touchIndexedKnowledgeDocument,
} from "@portfolio/database";
import { getAssistantModels } from "../ai/models";
import { chunkKnowledgeDocument } from "./chunking";
import { embedKnowledgeChunks } from "./embeddings";
import { normalizeSanityKnowledge } from "./normalization";
import { fetchSanityKnowledgeSources } from "./sanity";
import { withAssistantSpan } from "./telemetry";
import type { NormalizedKnowledgeDocument } from "./types";

const INGESTION_LOCK_KEY = "portfolio";
const STALE_RUN_AFTER_MS = 30 * 60 * 1_000;

export type IngestionSummary = {
  runId: string;
  documentsSeen: number;
  documentsCreated: number;
  documentsUpdated: number;
  documentsUnchanged: number;
  documentsDeleted: number;
  chunksCreated: number;
};

export class IngestionAlreadyRunningError extends Error {
  constructor() {
    super("A portfolio indexing run is already in progress.");
    this.name = "IngestionAlreadyRunningError";
  }
}

function databaseErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  if ("cause" in error) return databaseErrorCode(error.cause);
  return undefined;
}

function contentHash(document: NormalizedKnowledgeDocument) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        canonicalUrl: document.canonicalUrl,
        metadata: document.metadata,
        sections: document.sections,
        slug: document.slug,
        sourceType: document.sourceType,
        title: document.title,
      }),
    )
    .digest("hex");
}

async function beginIngestionRun(
  trigger: "cli" | "admin" | "scheduled" | "webhook",
  force: boolean,
) {
  const staleBefore = new Date(Date.now() - STALE_RUN_AFTER_MS);
  await expireStaleIngestionRuns(staleBefore);

  try {
    const run = await createIngestionRun({ trigger, lockKey: INGESTION_LOCK_KEY, force });
    if (!run) throw new Error("The ingestion run could not be created.");
    return run;
  } catch (error) {
    if (databaseErrorCode(error) === "23505") throw new IngestionAlreadyRunningError();
    throw error;
  }
}

async function replaceDocument(options: {
  document: NormalizedKnowledgeDocument;
  hash: string;
  existingId?: string;
  documentIndex: number;
  documentCount: number;
  state: "changed" | "new";
  onProgress?: (message: string) => void;
}) {
  const chunks = chunkKnowledgeDocument(options.document);
  const embeddings = await embedKnowledgeChunks(
    chunks.map((chunk) => chunk.content),
    {
      onBatchStart: ({ batch, batches, chunksProcessed, chunksTotal }) => {
        options.onProgress?.(
          `Embedding ${options.documentIndex}/${options.documentCount}: ${options.document.title} (${options.state}) — batch ${batch}/${batches}, ${chunksProcessed}/${chunksTotal} chunks complete`,
        );
      },
    },
  );
  if (embeddings.length !== chunks.length) {
    throw new Error("The embedding provider returned an incomplete chunk batch.");
  }

  await replaceIndexedKnowledgeDocument({
    ...(options.existingId ? { existingId: options.existingId } : {}),
    document: {
      sanityDocumentId: options.document.sanityDocumentId,
      sourceType: options.document.sourceType,
      slug: options.document.slug,
      title: options.document.title,
      canonicalUrl: options.document.canonicalUrl,
      contentHash: options.hash,
      metadata: options.document.metadata,
      sanityUpdatedAt: options.document.sanityUpdatedAt,
    },
    chunks: chunks.map((chunk, index) => ({
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      embedding: embeddings[index] as number[],
      metadata: chunk.metadata,
      tokenCount: chunk.tokenCount,
    })),
  });

  return chunks.length;
}

async function markRunFailed(runId: string, error: unknown) {
  const message =
    error instanceof Error ? error.message.slice(0, 1_000) : "Unknown indexing failure.";
  await failIngestionRun(runId, message);
}

export async function synchronizePortfolioKnowledge(options: {
  trigger: "cli" | "admin" | "scheduled" | "webhook";
  force?: boolean;
  onProgress?: (message: string) => void;
}): Promise<IngestionSummary> {
  const force = options.force ?? false;
  options.onProgress?.(force ? "Preparing a forced reindex…" : "Preparing an incremental index…");
  const run = await beginIngestionRun(options.trigger, force);
  const summary: IngestionSummary = {
    runId: run.id,
    documentsSeen: 0,
    documentsCreated: 0,
    documentsUpdated: 0,
    documentsUnchanged: 0,
    documentsDeleted: 0,
    chunksCreated: 0,
  };

  try {
    return await withAssistantSpan(
      "ask-zomer.ingestion",
      { "ai.ingestion.run.id": run.id, "ai.ingestion.trigger": options.trigger },
      async () => {
        options.onProgress?.("Fetching published portfolio content from Sanity…");
        const sources = await fetchSanityKnowledgeSources();
        const documents = normalizeSanityKnowledge(sources);
        summary.documentsSeen = documents.length;

        options.onProgress?.(`Comparing ${documents.length} documents with the current index…`);
        const existing = await listIndexedKnowledgeDocuments();
        if (existing.length > 0 && documents.length === 0) {
          throw new Error("Sanity returned no indexable documents; stale deletion was refused.");
        }

        const existingBySanityId = new Map(existing.map((item) => [item.sanityDocumentId, item]));
        for (const [index, document] of documents.entries()) {
          const previous = existingBySanityId.get(document.sanityDocumentId);
          const hash = contentHash(document);
          if (!force && previous?.contentHash === hash) {
            options.onProgress?.(
              `Checking ${index + 1}/${documents.length}: ${document.title} (unchanged)`,
            );
            summary.documentsUnchanged += 1;
            await touchIndexedKnowledgeDocument(previous.id, document.sanityUpdatedAt);
            continue;
          }

          options.onProgress?.(
            `Embedding ${index + 1}/${documents.length}: ${document.title} (${previous ? "changed" : "new"})`,
          );
          summary.chunksCreated += await replaceDocument({
            document,
            hash,
            documentIndex: index + 1,
            documentCount: documents.length,
            state: previous ? "changed" : "new",
            ...(options.onProgress ? { onProgress: options.onProgress } : {}),
            ...(previous ? { existingId: previous.id } : {}),
          });
          if (previous) summary.documentsUpdated += 1;
          else summary.documentsCreated += 1;
        }

        const sourceIds = documents.map((document) => document.sanityDocumentId);
        if (sourceIds.length > 0) {
          options.onProgress?.("Removing documents that are no longer published…");
          summary.documentsDeleted = await deleteKnowledgeDocumentsNotIn(sourceIds);
        }

        options.onProgress?.("Saving the ingestion summary…");
        const models = getAssistantModels();
        await completeIngestionRun(run.id, {
          ...summary,
          force,
          embeddingModel: models.embeddingModelId,
        });

        return summary;
      },
    );
  } catch (error) {
    await markRunFailed(run.id, error);
    throw error;
  }
}

export async function getKnowledgeIndexStatus() {
  return readKnowledgeIndexStatus();
}

export function listIngestionRuns(limit = 20) {
  return listRecentIngestionRuns(limit);
}
