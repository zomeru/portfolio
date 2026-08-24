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
import { ASSISTANT_INDEX_VERSION } from "./config";
import { embedKnowledgeChunks } from "./embeddings";
import { normalizeSanityKnowledge } from "./normalization";
import { fetchSanityKnowledgeSource, fetchSanityKnowledgeSources } from "./sanity";
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

function contentHash(document: NormalizedKnowledgeDocument, embeddingModelId: string) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        canonicalUrl: document.canonicalUrl,
        embeddingModelId,
        indexVersion: ASSISTANT_INDEX_VERSION,
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
  embeddingModelId: string;
  hash: string;
  existingId?: string;
  documentIndex: number;
  documentCount: number;
  state: "changed" | "new";
  onProgress?: (message: string) => void;
}) {
  const chunks = chunkKnowledgeDocument(options.document);
  const embeddings = await embedKnowledgeChunks(
    chunks.map((chunk) => chunk.embeddingText),
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
      metadata: {
        ...options.document.metadata,
        embeddingModel: options.embeddingModelId,
        indexVersion: ASSISTANT_INDEX_VERSION,
      },
      sanityUpdatedAt: options.document.sanityUpdatedAt,
    },
    chunks: chunks.map((chunk, index) => ({
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      embedding: embeddings[index] as number[],
      metadata: {
        ...chunk.metadata,
        embeddingModel: options.embeddingModelId,
        indexVersion: ASSISTANT_INDEX_VERSION,
      },
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

function createIngestionSummary(runId: string): IngestionSummary {
  return {
    runId,
    documentsSeen: 0,
    documentsCreated: 0,
    documentsUpdated: 0,
    documentsUnchanged: 0,
    documentsDeleted: 0,
    chunksCreated: 0,
  };
}

async function completeRun(runId: string, summary: IngestionSummary, force: boolean) {
  const models = getAssistantModels();
  await completeIngestionRun(runId, {
    ...summary,
    force,
    embeddingModel: models.embeddingModelId,
  });
}

async function indexDocument(options: {
  document: NormalizedKnowledgeDocument;
  documentCount: number;
  documentIndex: number;
  embeddingModelId: string;
  force: boolean;
  onProgress?: (message: string) => void;
  summary: IngestionSummary;
  existingBySanityId: Map<string, { contentHash: string; id: string }>;
}) {
  const previous = options.existingBySanityId.get(options.document.sanityDocumentId);
  const hash = contentHash(options.document, options.embeddingModelId);
  if (!options.force && previous?.contentHash === hash) {
    options.onProgress?.(
      `Checking ${options.documentIndex}/${options.documentCount}: ${options.document.title} (unchanged)`,
    );
    options.summary.documentsUnchanged += 1;
    await touchIndexedKnowledgeDocument(previous.id, options.document.sanityUpdatedAt);
    return;
  }

  options.onProgress?.(
    `Embedding ${options.documentIndex}/${options.documentCount}: ${options.document.title} (${previous ? "changed" : "new"})`,
  );
  options.summary.chunksCreated += await replaceDocument({
    document: options.document,
    embeddingModelId: options.embeddingModelId,
    hash,
    documentIndex: options.documentIndex,
    documentCount: options.documentCount,
    state: previous ? "changed" : "new",
    ...(options.onProgress ? { onProgress: options.onProgress } : {}),
    ...(previous ? { existingId: previous.id } : {}),
  });
  if (previous) options.summary.documentsUpdated += 1;
  else options.summary.documentsCreated += 1;
}

export async function synchronizePortfolioKnowledge(options: {
  trigger: "cli" | "admin" | "scheduled" | "webhook";
  force?: boolean;
  onProgress?: (message: string) => void;
}): Promise<IngestionSummary> {
  const force = options.force ?? false;
  options.onProgress?.(force ? "Preparing a forced reindex…" : "Preparing an incremental index…");
  const run = await beginIngestionRun(options.trigger, force);
  const summary = createIngestionSummary(run.id);

  try {
    return await withAssistantSpan(
      "ask-zomer.ingestion",
      { "ai.ingestion.run.id": run.id, "ai.ingestion.trigger": options.trigger },
      async () => {
        options.onProgress?.("Fetching published portfolio content from Sanity…");
        const sources = await fetchSanityKnowledgeSources();
        const documents = normalizeSanityKnowledge(sources);
        const embeddingModelId = getAssistantModels().embeddingModelId;
        summary.documentsSeen = documents.length;

        options.onProgress?.(`Comparing ${documents.length} documents with the current index…`);
        const existing = await listIndexedKnowledgeDocuments();
        if (existing.length > 0 && documents.length === 0) {
          throw new Error("Sanity returned no indexable documents; stale deletion was refused.");
        }

        const existingBySanityId = new Map(existing.map((item) => [item.sanityDocumentId, item]));
        for (const [index, document] of documents.entries()) {
          await indexDocument({
            document,
            documentIndex: index + 1,
            documentCount: documents.length,
            embeddingModelId,
            existingBySanityId,
            force,
            summary,
            ...(options.onProgress ? { onProgress: options.onProgress } : {}),
          });
        }

        const sourceIds = documents.map((document) => document.sanityDocumentId);
        if (sourceIds.length > 0) {
          options.onProgress?.("Removing documents that are no longer published…");
          summary.documentsDeleted = await deleteKnowledgeDocumentsNotIn(sourceIds);
        }

        options.onProgress?.("Saving the ingestion summary…");
        await completeRun(run.id, summary, force);

        return summary;
      },
    );
  } catch (error) {
    await markRunFailed(run.id, error);
    throw error;
  }
}

export async function synchronizePublishedKnowledgeDocument(options: {
  documentId: string;
  trigger: "admin" | "scheduled" | "webhook";
  onProgress?: (message: string) => void;
}): Promise<IngestionSummary> {
  options.onProgress?.("Preparing a single-document index…");
  const run = await beginIngestionRun(options.trigger, false);
  const summary = createIngestionSummary(run.id);

  try {
    return await withAssistantSpan(
      "ask-zomer.ingestion.document",
      {
        "ai.ingestion.document.id": options.documentId,
        "ai.ingestion.run.id": run.id,
        "ai.ingestion.trigger": options.trigger,
      },
      async () => {
        options.onProgress?.("Fetching the published document from Sanity…");
        const source = await fetchSanityKnowledgeSource(options.documentId);
        const [document] = source ? normalizeSanityKnowledge([source]) : [];
        if (!document) {
          throw new Error("The published Sanity document is not available for indexing.");
        }
        summary.documentsSeen = 1;
        const embeddingModelId = getAssistantModels().embeddingModelId;

        const existing = await listIndexedKnowledgeDocuments();
        const existingBySanityId = new Map(existing.map((item) => [item.sanityDocumentId, item]));
        await indexDocument({
          document,
          documentCount: 1,
          documentIndex: 1,
          embeddingModelId,
          existingBySanityId,
          force: false,
          summary,
          ...(options.onProgress ? { onProgress: options.onProgress } : {}),
        });

        options.onProgress?.("Saving the ingestion summary…");
        await completeRun(run.id, summary, false);
        return summary;
      },
    );
  } catch (error) {
    await markRunFailed(run.id, error);
    throw error;
  }
}

export async function getKnowledgeIndexStatus() {
  const status = await readKnowledgeIndexStatus();
  return {
    ...status,
    embeddingModel: getAssistantModels().embeddingModelId,
    indexVersion: ASSISTANT_INDEX_VERSION,
  };
}

export function listIngestionRuns(limit = 20) {
  return listRecentIngestionRuns(limit);
}
