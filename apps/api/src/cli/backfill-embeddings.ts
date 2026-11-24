import { setTimeout as wait } from "node:timers/promises";

import { getEmbeddingModel } from "../services/ai/models";
import { embedKnowledgeChunks } from "../services/assistant/embeddings";

// Limit each backfill to 15 request starts per minute, including SDK retries.
const REQUEST_INTERVAL_MS = 4_000;

export function createBackfillEmbedder(): typeof embedKnowledgeChunks {
  let nextRequestAt = 0;
  const pacedFetch: typeof fetch = async (request, init) => {
    const signal = init?.signal;
    let delay = nextRequestAt - performance.now();
    while (delay > 0) {
      await wait(Math.ceil(delay), undefined, signal ? { signal } : undefined);
      delay = nextRequestAt - performance.now();
    }
    signal?.throwIfAborted();
    nextRequestAt = performance.now() + REQUEST_INTERVAL_MS;
    return fetch(request, init);
  };
  const model = getEmbeddingModel("passage", pacedFetch);

  return (values, options) => embedKnowledgeChunks(values, { ...options, model });
}
