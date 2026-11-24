import { ASSISTANT_EMBEDDING } from "@portfolio/env/embedding";
import { APICallError, embed, embedMany } from "ai";

import { getEmbeddingModel } from "../ai/models";

const EMBEDDING_BATCH_SIZE = 16;

export class EmbeddingContentRejectedError extends Error {
  constructor() {
    super("The embedding provider rejected the content.");
    this.name = "EmbeddingContentRejectedError";
  }
}

function assertEmbeddingDimensions(embedding: readonly number[]) {
  if (embedding.length !== ASSISTANT_EMBEDDING.dimensions) {
    throw new Error(
      `The configured embedding model returned ${embedding.length} dimensions; expected ${ASSISTANT_EMBEDDING.dimensions}. A model dimension change requires a database migration and reindex.`,
    );
  }
  if (embedding.some((value) => !Number.isFinite(value))) {
    throw new Error("The configured embedding model returned a non-finite vector value.");
  }
  if (!embedding.some((value) => value !== 0)) {
    throw new Error("The configured embedding model returned an empty vector.");
  }
}

export async function embedQuery(value: string): Promise<number[]> {
  const result = await embed({
    model: getEmbeddingModel("query"),
    value,
    maxRetries: 2,
    abortSignal: AbortSignal.timeout(30_000),
    telemetry: {
      functionId: "ask-zomer.query-embedding",
      recordInputs: false,
      recordOutputs: false,
    },
  });
  assertEmbeddingDimensions(result.embedding);
  return result.embedding;
}

export async function embedKnowledgeChunks(
  values: readonly string[],
  options: {
    signal?: AbortSignal;
    onBatchStart?: (progress: {
      batch: number;
      batches: number;
      chunksProcessed: number;
      chunksTotal: number;
    }) => void;
  } = {},
): Promise<number[][]> {
  const model = getEmbeddingModel("passage");
  const embeddings: number[][] = [];
  const batches = Math.ceil(values.length / EMBEDDING_BATCH_SIZE);

  for (let start = 0; start < values.length; start += EMBEDDING_BATCH_SIZE) {
    const batch = values.slice(start, start + EMBEDDING_BATCH_SIZE);
    options.onBatchStart?.({
      batch: Math.floor(start / EMBEDDING_BATCH_SIZE) + 1,
      batches,
      chunksProcessed: start,
      chunksTotal: values.length,
    });
    const timeout = AbortSignal.timeout(45_000);
    const result = await embedMany({
      model,
      values: batch,
      maxRetries: 2,
      maxParallelCalls: 2,
      abortSignal: options.signal ? AbortSignal.any([timeout, options.signal]) : timeout,
      telemetry: {
        functionId: "portfolio.passage-embedding",
        recordInputs: false,
        recordOutputs: false,
      },
    }).catch((error: unknown) => {
      if (
        APICallError.isInstance(error) &&
        error.statusCode === 422 &&
        error.message.includes("content safety screening")
      ) {
        throw new EmbeddingContentRejectedError();
      }
      throw error;
    });
    if (result.embeddings.length !== batch.length) {
      throw new Error("The embedding provider returned an incomplete batch.");
    }
    for (const embedding of result.embeddings) assertEmbeddingDimensions(embedding);
    embeddings.push(...result.embeddings);
  }

  return embeddings;
}
