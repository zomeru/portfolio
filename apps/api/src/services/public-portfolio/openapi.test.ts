import assert from "node:assert/strict";
import test from "node:test";
import { PUBLIC_REST_PATHS } from "./contract";
import { getOpenApiDocument } from "./openapi";
import { testSiteUrl } from "./test-fixtures";

test("OpenAPI 3.2 covers every public REST route with unique operation IDs", () => {
  const document = getOpenApiDocument(testSiteUrl);
  assert.equal(document.openapi, "3.2.0");
  assert.deepEqual(Object.keys(document.paths).sort(), [...PUBLIC_REST_PATHS].sort());
  assert.deepEqual(document.security, []);

  const operationIds = Object.values(document.paths).map((path) => path.get.operationId);
  assert.equal(new Set(operationIds).size, operationIds.length);
  assert.ok(Object.keys(document.components.schemas).includes("Error"));
});
