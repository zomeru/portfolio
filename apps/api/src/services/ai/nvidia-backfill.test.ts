import assert from "node:assert/strict";
import test from "node:test";

import { ASSISTANT_EMBEDDING } from "@portfolio/env/embedding";

import { createNvidiaBackfillEmbedder } from "./nvidia-backfill";

process.env.NVIDIA_NIM_API_KEY = "test-key";
delete process.env.NVIDIA_NIM_EMBEDDING_URL;

void test("paces NIM requests across documents and restores response order", async (t) => {
  const vector = Array.from({ length: ASSISTANT_EMBEDDING.dimensions }, (_, i) =>
    i === 0 ? 1 : 0,
  );
  const starts: number[] = [];
  const requests = t.mock.method(globalThis, "fetch", (url: string, init: RequestInit) => {
    starts.push(performance.now());
    assert.equal(url, "https://integrate.api.nvidia.com/v1/embeddings");
    assert.ok(typeof init.body === "string");
    assert.deepEqual(JSON.parse(init.body), {
      model: ASSISTANT_EMBEDDING.nvidiaModel,
      input: ["First passage", "Second passage"],
      input_type: "passage",
      encoding_format: "float",
      dimensions: ASSISTANT_EMBEDDING.dimensions,
    });
    return Promise.resolve(
      Response.json({
        data: [
          { index: 1, embedding: vector.map((value) => -value) },
          { index: 0, embedding: vector },
        ],
      }),
    );
  });
  const embed = createNvidiaBackfillEmbedder();

  for (let document = 0; document < 2; document++) {
    const embeddings = await embed(["First passage", "Second passage"]);
    assert.deepEqual(
      embeddings.map((embedding) => embedding[0]),
      [1, -1],
    );
  }
  const [first, second] = starts;
  assert.ok(first !== undefined && second !== undefined);
  assert.ok(second - first >= 1_950);

  const abort = new AbortController();
  const pending = embed(["Cancelled passage"], { signal: abort.signal });
  abort.abort();
  await assert.rejects(pending);
  assert.equal(requests.mock.callCount(), 2);
});

void test("uses the deployed NIM model and stops on rate limiting", async (t) => {
  const endpoint = "https://nim.example.com/v1/embeddings";
  process.env.NVIDIA_NIM_EMBEDDING_URL = endpoint;
  t.after(() => {
    delete process.env.NVIDIA_NIM_EMBEDDING_URL;
  });
  const requests = t.mock.method(globalThis, "fetch", (url: string, init: RequestInit) => {
    assert.equal(url, endpoint);
    assert.ok(typeof init.body === "string");
    const body: unknown = JSON.parse(init.body);
    assert.ok(body && typeof body === "object" && "model" in body);
    assert.equal(body.model, ASSISTANT_EMBEDDING.nvidiaDeployedModel);
    return Promise.resolve(new Response(null, { status: 429 }));
  });
  const embed = createNvidiaBackfillEmbedder();
  await assert.rejects(embed(["Synthetic passage"]), /HTTP 429/);
  assert.equal(requests.mock.callCount(), 1);
});
