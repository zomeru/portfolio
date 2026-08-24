import { embed, embedMany } from "ai";
import { ASSISTANT_EMBEDDING_DIMENSIONS, getAssistantModels } from "../ai/models";

const EMBEDDING_BATCH_SIZE = 16;

function assertEmbeddingDimensions(embedding: readonly number[]) {
  if (embedding.length !== ASSISTANT_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `The configured embedding model returned ${embedding.length} dimensions; expected ${ASSISTANT_EMBEDDING_DIMENSIONS}. A model dimension change requires a database migration and reindex.`,
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
  const models = getAssistantModels();
  const result = await embed({
    model: models.queryEmbedding,
    value,
    maxRetries: 2,
    abortSignal: AbortSignal.timeout(30_000),
    telemetry: { functionId: "ask-zomer.query-embedding" },
  });
  assertEmbeddingDimensions(result.embedding);
  return result.embedding;
}

export async function embedKnowledgeChunks(
  values: readonly string[],
  options: {
    onBatchStart?: (progress: {
      batch: number;
      batches: number;
      chunksProcessed: number;
      chunksTotal: number;
    }) => void;
  } = {},
): Promise<number[][]> {
  const models = getAssistantModels();
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
    const result = await embedMany({
      model: models.documentEmbedding,
      values: batch,
      maxRetries: 2,
      maxParallelCalls: 2,
      abortSignal: AbortSignal.timeout(45_000),
      telemetry: { functionId: "ask-zomer.knowledge-embedding" },
    });
    for (const embedding of result.embeddings) assertEmbeddingDimensions(embedding);
    embeddings.push(...result.embeddings);
  }

  return embeddings;
}
