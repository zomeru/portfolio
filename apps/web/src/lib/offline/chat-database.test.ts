import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import type { AskZomerMessage } from "@portfolio/api/types";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";

import {
  acquireSyncLease,
  cacheServerMessages,
  deleteOfflineDatabaseForTests,
  getCachedMessages,
  getPendingMessages,
  markMessagesFailed,
  markMessagesSynced,
  putLocalMessage,
  releaseSyncLease,
} from "./chat-database";

Object.assign(globalThis, { IDBKeyRange, indexedDB });

function message(id: string, createdAt: string): AskZomerMessage {
  return {
    id,
    role: "user",
    parts: [{ type: "text", text: id }],
    metadata: { createdAt },
  };
}

void describe("offline chat database", () => {
  beforeEach(() => deleteOfflineDatabaseForTests());
  afterEach(() => deleteOfflineDatabaseForTests());

  void it("persists ordered pending messages and keeps failed records retryable", async () => {
    const sessionKey = "session";
    const later = message("later", "2026-09-02T10:00:02.000Z");
    const earlier = message("earlier", "2026-09-02T10:00:01.000Z");
    await putLocalMessage(sessionKey, later);
    await putLocalMessage(sessionKey, earlier);

    assert.deepEqual(
      (await getPendingMessages(sessionKey)).map((record) => record.id),
      ["earlier", "later"],
    );
    await markMessagesFailed(["earlier"]);
    assert.equal((await getPendingMessages(sessionKey))[0]?.retryCount, 1);
    await markMessagesSynced(["earlier"]);
    assert.deepEqual(
      (await getPendingMessages(sessionKey)).map((record) => record.id),
      ["later"],
    );
  });

  void it("reconciles server acknowledgements without deleting local history", async () => {
    const sessionKey = "session";
    const local = message("same-id", "2026-09-02T10:00:01.000Z");
    await putLocalMessage(sessionKey, local);
    await cacheServerMessages(sessionKey, [local]);

    const records = await getCachedMessages(sessionKey);
    assert.equal(records.length, 1);
    assert.equal(records[0]?.syncState, "synced");
  });

  void it("grants one cross-tab synchronization lease at a time", async () => {
    assert.equal(await acquireSyncLease("session", "tab-a"), true);
    assert.equal(await acquireSyncLease("session", "tab-b"), false);
    await releaseSyncLease("session", "tab-a");
    assert.equal(await acquireSyncLease("session", "tab-b"), true);
  });
});
