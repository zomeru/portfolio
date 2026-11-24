import assert from "node:assert/strict";
import test from "node:test";

import { ASSISTANT_EMBEDDING } from "@portfolio/env/embedding";

import { createBackfillEmbedder } from "./backfill-embeddings";

void test("paces OpenRouter passage requests across retries and documents", async (t) => {
  const previousKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = "test-key";
  t.after(() => {
    if (previousKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previousKey;
  });

  const requests: { startedAt: number; body: unknown }[] = [];
  const embedding = Array<number>(ASSISTANT_EMBEDDING.dimensions).fill(0.5);
  t.mock.method(globalThis, "fetch", async (input: string, init?: RequestInit) => {
    assert.equal(input, "https://openrouter.ai/api/v1/embeddings");
    const body = init?.body;
    assert.ok(typeof body === "string");
    requests.push({ startedAt: performance.now(), body: JSON.parse(body) });
    if (requests.length === 1) {
      return Response.json(
        { error: { code: 503, message: "Service unavailable" } },
        { status: 503 },
      );
    }
    return Response.json({
      object: "list",
      model: ASSISTANT_EMBEDDING.model,
      data: [{ index: 0, object: "embedding", embedding }],
    });
  });

  const embed = createBackfillEmbedder();
  assert.deepEqual(await embed(["First document"]), [embedding]);
  assert.deepEqual(await embed(["Second document"]), [embedding]);
  assert.deepEqual(
    requests.map(({ body }) => body),
    ["First document", "First document", "Second document"].map((input) => ({
      model: ASSISTANT_EMBEDDING.model,
      input: [input],
      input_type: "passage",
      provider: { require_parameters: true },
    })),
  );
  for (const [index, previous] of requests.slice(0, -1).entries()) {
    const next = requests[index + 1];
    assert.ok(next && next.startedAt - previous.startedAt >= 3_950);
  }
});
