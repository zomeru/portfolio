import assert from "node:assert/strict";
import test from "node:test";

import { findChatSessionByKey } from "./repositories/assistant";

void test("Neon HTTP queries call fetch with its global receiver", async (t) => {
  const previousUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL =
    "postgresql://test:test@ep-test.us-east-2.aws.neon.tech/portfolio?sslmode=require";
  t.after(() => {
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
  });

  t.mock.method(globalThis, "fetch", async function (this: unknown, input: string) {
    assert.ok(this === globalThis, "Workers fetch must be called with globalThis as its receiver");
    assert.equal(input, "https://api.us-east-2.aws.neon.tech/sql");
    return Response.json({
      fields: [{ name: "id", dataTypeID: 2950 }],
      rows: [],
      rowCount: 0,
      command: "SELECT",
      rowAsArray: true,
    });
  });

  assert.equal(await findChatSessionByKey("4a45132f-5c1f-4d48-adae-d35b88d4775b"), undefined);
});
