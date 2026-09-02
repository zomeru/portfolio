import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AskZomerOfflineSyncMessage } from "../../types";
import {
  OfflineSyncConflictError,
  OfflineSyncRateLimitError,
  OfflineSyncTimestampError,
  synchronizeOfflineConversation,
} from "./offline-sync";

const now = Date.parse("2026-09-02T10:00:00.000Z");

function messages(): AskZomerOfflineSyncMessage[] {
  return [
    {
      content: "What projects has Zomer built?",
      createdAt: "2026-09-02T09:00:00.000Z",
      id: "11111111-1111-4111-8111-111111111111",
      role: "user",
    },
    {
      content: "The cached portfolio lists Batibot and Rezumer AI.",
      createdAt: "2026-09-02T09:00:02.000Z",
      id: "22222222-2222-4222-8222-222222222222",
      model: "offline:SmolLM2-360M-Instruct-q4f16_1-MLC",
      role: "assistant",
      sources: [
        {
          id: "project:batibot",
          sourceType: "project",
          title: "Batibot",
          url: "/en/projects/batibot",
        },
        {
          id: "unsafe",
          sourceType: "project",
          title: "Unsafe",
          url: "https://example.com/private",
        },
        {
          id: "private-route",
          sourceType: "project",
          title: "Private route",
          url: "/admin?token=secret",
        },
      ],
    },
  ];
}

function createHarness() {
  const stored = new Map<
    string,
    { content: string; role: "assistant" | "user"; sessionId: string }
  >();
  let failOnceFor: string | undefined;
  const dependencies = {
    now: () => now,
    siteOrigin: "https://zomeru.dev",
    findOrCreateSession: async () => ({ id: "session-id" }),
    findMessage: async (id: string) => {
      const found = stored.get(id);
      return found ? { id, ...found } : undefined;
    },
    countUserMessages: async () => ({
      day: [...stored.values()].filter((message) => message.role === "user").length,
      minute: 0,
    }),
    createMessage: async (message: {
      citations?: Array<{ url: string }>;
      content: string;
      providerMessageId: string;
      role: "assistant" | "user";
      sessionId: string;
    }) => {
      if (failOnceFor === message.providerMessageId) {
        failOnceFor = undefined;
        throw new Error("temporary database error");
      }
      const existing = stored.get(message.providerMessageId);
      if (existing) {
        return existing.content === message.content &&
          existing.role === message.role &&
          existing.sessionId === message.sessionId
          ? ("existing" as const)
          : ("conflict" as const);
      }
      if (message.role === "assistant") {
        assert.deepEqual(
          message.citations?.map((citation) => citation.url),
          ["https://zomeru.dev/en/projects/batibot"],
        );
      }
      stored.set(message.providerMessageId, message);
      return "created" as const;
    },
  };
  return {
    dependencies,
    failOnce(id: string) {
      failOnceFor = id;
    },
    stored,
  };
}

void describe("offline conversation synchronization", () => {
  void it("is idempotent across repeated batches and filters cross-origin citations", async () => {
    const harness = createHarness();
    const input = { messages: messages(), sessionKey: "33333333-3333-4333-8333-333333333333" };

    const first = await synchronizeOfflineConversation(input, harness.dependencies);
    const second = await synchronizeOfflineConversation(input, harness.dependencies);

    assert.deepEqual(
      first.syncedMessageIds,
      input.messages.map((message) => message.id),
    );
    assert.deepEqual(second, first);
    assert.equal(harness.stored.size, 2);
  });

  void it("can resume a partially persisted batch without duplicates", async () => {
    const harness = createHarness();
    const input = { messages: messages(), sessionKey: "33333333-3333-4333-8333-333333333333" };
    harness.failOnce(input.messages[1]!.id);

    await assert.rejects(() => synchronizeOfflineConversation(input, harness.dependencies));
    assert.equal(harness.stored.size, 1);
    await synchronizeOfflineConversation(input, harness.dependencies);
    assert.equal(harness.stored.size, 2);
  });

  void it("rejects a message identifier reused with different content", async () => {
    const harness = createHarness();
    const input = { messages: messages(), sessionKey: "33333333-3333-4333-8333-333333333333" };
    await synchronizeOfflineConversation(input, harness.dependencies);
    input.messages[0] = { ...input.messages[0]!, content: "Changed content" };

    await assert.rejects(
      () => synchronizeOfflineConversation(input, harness.dependencies),
      OfflineSyncConflictError,
    );
  });

  void it("rejects timestamps outside the accepted offline window", async () => {
    const harness = createHarness();
    const input = { messages: messages(), sessionKey: "33333333-3333-4333-8333-333333333333" };
    input.messages[0] = { ...input.messages[0]!, createdAt: "2025-01-01T00:00:00.000Z" };

    await assert.rejects(
      () => synchronizeOfflineConversation(input, harness.dependencies),
      OfflineSyncTimestampError,
    );
    assert.equal(harness.stored.size, 0);
  });

  void it("applies the existing daily user-message limit to new offline messages", async () => {
    const harness = createHarness();
    harness.dependencies.countUserMessages = async () => ({ day: 120, minute: 0 });

    await assert.rejects(
      () =>
        synchronizeOfflineConversation(
          {
            messages: [messages()[0]!],
            sessionKey: "33333333-3333-4333-8333-333333333333",
          },
          harness.dependencies,
        ),
      OfflineSyncRateLimitError,
    );
    assert.equal(harness.stored.size, 0);
  });
});
