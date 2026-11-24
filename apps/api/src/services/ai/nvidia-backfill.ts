import { setTimeout as wait } from "node:timers/promises";

import { ASSISTANT_EMBEDDING, getNvidiaEmbeddingEnv } from "@portfolio/env/embedding";
import { z } from "zod";

import { type embedKnowledgeChunks, embedPassageBatches } from "../assistant/embeddings";

// Keep each sequential backfill below 40 requests per minute with room for other callers.
const REQUEST_INTERVAL_MS = 2_000;
const responseSchema = z.object({
  data: z.array(
    z.object({ index: z.number().int().nonnegative(), embedding: z.array(z.number()) }),
  ),
});

export function createNvidiaBackfillEmbedder(): typeof embedKnowledgeChunks {
  const { apiKey, endpoint, model } = getNvidiaEmbeddingEnv();
  let nextRequestAt = 0;

  return (values, options) =>
    embedPassageBatches(values, options ?? {}, async (batch, signal) => {
      const delay = nextRequestAt - performance.now();
      if (delay > 0) await wait(Math.ceil(delay), undefined, { signal });
      signal.throwIfAborted();
      nextRequestAt = performance.now() + REQUEST_INTERVAL_MS;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          input: batch,
          input_type: "passage",
          encoding_format: "float",
          dimensions: ASSISTANT_EMBEDDING.dimensions,
        }),
        redirect: "error",
        signal,
      });

      if (!response.ok) {
        await response.body?.cancel();
        const reason =
          response.status === 401
            ? " Check NVIDIA_NIM_API_KEY."
            : response.status === 429
              ? " Wait for the NVIDIA quota window before resuming."
              : "";
        throw new Error(`NVIDIA NIM embeddings failed (HTTP ${response.status}).${reason}`);
      }

      const result = responseSchema.safeParse(await response.json());
      if (!result.success) throw new Error("NVIDIA NIM returned an invalid embedding response.");
      const ordered = result.data.data.sort((left, right) => left.index - right.index);
      if (ordered.some((item, index) => item.index !== index)) {
        throw new Error("NVIDIA NIM returned invalid embedding indices.");
      }
      return ordered.map(({ embedding }) => embedding);
    });
}
