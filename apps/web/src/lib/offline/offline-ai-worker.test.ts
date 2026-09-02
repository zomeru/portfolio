import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { it } from "node:test";

void it("bundles the offline AI worker as executable browser JavaScript", async () => {
  const source = await readFile(
    new URL("../../../public/offline-ai-worker.js", import.meta.url),
    "utf8",
  );
  assert.ok(source.length > 100_000);
  assert.doesNotMatch(source, /from\s*["']@mlc-ai\/web-llm/u);
  assert.match(source, /onmessage/u);
});
