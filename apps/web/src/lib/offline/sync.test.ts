import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AskZomerMessage } from "@portfolio/api/types";

import type { StoredChatMessage } from "./chat-database";
import { synchronizePendingMessages, type OfflineSyncDependencies } from "./sync";

function record(id: string, role: "assistant" | "user"): StoredChatMessage {
  const createdAt = role === "user" ? "2026-09-02T10:00:00.000Z" : "2026-09-02T10:00:01.000Z";
  const message: AskZomerMessage = {
    id,
    role,
    parts: [{ type: "text", text: `${role} content` }],
    metadata: {
      createdAt,
      ...(role === "assistant" ? { model: "offline:test", sources: [] } : {}),
    },
  };
  return {
    createdAt,
    id,
    message,
    retryCount: 0,
    sessionKey: "session",
    syncState: "pending",
    updatedAt: 0,
  };
}

function createHarness(records: StoredChatMessage[]) {
  const stored = new Map(records.map((item) => [item.id, item]));
  const server = new Set<string>();
  let requestCount = 0;
  const dependencies: OfflineSyncDependencies = {
    acquireLease: async () => true,
    releaseLease: async () => undefined,
    getPending: async (_sessionKey, limit) =>
      [...stored.values()].filter((item) => item.syncState !== "synced").slice(0, limit),
    markSyncing: async (ids) => {
      for (const id of ids) stored.get(id)!.syncState = "syncing";
    },
    markSynced: async (ids) => {
      for (const id of ids) stored.get(id)!.syncState = "synced";
    },
    markFailed: async (ids) => {
      for (const id of ids) stored.get(id)!.syncState = "failed";
    },
    request: async (_sessionKey, messages) => {
      requestCount += 1;
      for (const message of messages) server.add(message.id);
      return { syncedMessageIds: messages.map((message) => message.id) };
    },
  };
  return {
    dependencies,
    get requestCount() {
      return requestCount;
    },
    server,
    stored,
  };
}

void describe("offline outbox synchronization", () => {
  void it("marks records synced only after acknowledgement and does not resend them", async () => {
    const harness = createHarness([record("user", "user"), record("assistant", "assistant")]);
    const first = await synchronizePendingMessages("session", "tab", harness.dependencies);
    const second = await synchronizePendingMessages("session", "tab", harness.dependencies);

    assert.deepEqual(first, { attempted: 2, synced: 2 });
    assert.deepEqual(second, { attempted: 0, synced: 0 });
    assert.equal(harness.requestCount, 1);
    assert.deepEqual([...harness.server].sort(), ["assistant", "user"]);
  });

  void it("retains the batch as failed when the server response is partial", async () => {
    const harness = createHarness([record("user", "user"), record("assistant", "assistant")]);
    harness.dependencies.request = async () => ({ syncedMessageIds: ["user"] });

    await assert.rejects(() => synchronizePendingMessages("session", "tab", harness.dependencies));
    assert.deepEqual(
      [...harness.stored.values()].map((item) => item.syncState),
      ["failed", "failed"],
    );
  });

  void it("does nothing when another tab owns the lease", async () => {
    const harness = createHarness([record("user", "user")]);
    harness.dependencies.acquireLease = async () => false;
    const result = await synchronizePendingMessages("session", "tab", harness.dependencies);
    assert.deepEqual(result, { attempted: 0, synced: 0 });
    assert.equal(harness.requestCount, 0);
  });
});
