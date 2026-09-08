import type {
  AskZomerOfflineSyncMessage,
  AskZomerOfflineSyncResult,
  AskZomerSource,
} from "@portfolio/api/types";

import {
  acquireSyncLease,
  getPendingMessages,
  markMessagesFailed,
  markMessagesSynced,
  markMessagesSyncing,
  releaseSyncLease,
  type StoredChatMessage,
} from "./chat-database";

const SYNC_BATCH_SIZE = 20;
const SYNC_REQUEST_TIMEOUT_MS = 20_000;

function messageText(record: StoredChatMessage) {
  return record.message.parts
    .filter(
      (part): part is Extract<(typeof record.message.parts)[number], { type: "text" }> =>
        part.type === "text",
    )
    .map((part) => part.text)
    .join("")
    .trim();
}

function toSyncMessage(record: StoredChatMessage): AskZomerOfflineSyncMessage {
  const content = messageText(record);
  if (record.message.role === "assistant") {
    return {
      content,
      createdAt: record.createdAt,
      id: record.id,
      model: record.message.metadata?.model?.startsWith("offline:")
        ? record.message.metadata.model
        : "offline:webllm",
      role: "assistant",
      sources: (record.message.metadata?.sources ?? []).filter(
        (
          source,
        ): source is AskZomerSource & {
          sourceType: Exclude<AskZomerSource["sourceType"], "web">;
        } => source.sourceType !== "web",
      ),
    };
  }
  return {
    content,
    createdAt: record.createdAt,
    id: record.id,
    role: "user",
  };
}

export type OfflineSyncDependencies = {
  acquireLease: typeof acquireSyncLease;
  getPending: typeof getPendingMessages;
  markFailed: typeof markMessagesFailed;
  markSynced: typeof markMessagesSynced;
  markSyncing: typeof markMessagesSyncing;
  releaseLease: typeof releaseSyncLease;
  request: (
    sessionKey: string,
    messages: AskZomerOfflineSyncMessage[],
  ) => Promise<AskZomerOfflineSyncResult>;
};

const defaultDependencies: OfflineSyncDependencies = {
  acquireLease: acquireSyncLease,
  getPending: getPendingMessages,
  markFailed: markMessagesFailed,
  markSynced: markMessagesSynced,
  markSyncing: markMessagesSyncing,
  releaseLease: releaseSyncLease,
  request: async (sessionKey, messages) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), SYNC_REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(
        `/api/ai/sessions/${encodeURIComponent(sessionKey)}/offline-messages`,
        {
          body: JSON.stringify({ messages }),
          cache: "no-store",
          credentials: "include",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        },
      );
      if (!response.ok) {
        throw new Error(`Offline chat synchronization failed (${response.status}).`);
      }
      return (await response.json()) as AskZomerOfflineSyncResult;
    } finally {
      window.clearTimeout(timeout);
    }
  },
};

export async function synchronizePendingMessages(
  sessionKey: string,
  ownerId: string,
  dependencies: OfflineSyncDependencies = defaultDependencies,
) {
  if (!(await dependencies.acquireLease(sessionKey, ownerId))) {
    return { attempted: 0, synced: 0 };
  }

  let attempted = 0;
  let synced = 0;
  try {
    while (true) {
      if (!(await dependencies.acquireLease(sessionKey, ownerId))) break;
      const pending = await dependencies.getPending(sessionKey, SYNC_BATCH_SIZE);
      if (pending.length === 0) break;
      const ids = pending.map((record) => record.id);
      attempted += ids.length;
      await dependencies.markSyncing(ids);
      try {
        const result = await dependencies.request(sessionKey, pending.map(toSyncMessage));
        const confirmedIds = new Set(result.syncedMessageIds);
        if (ids.some((id) => !confirmedIds.has(id))) {
          throw new Error("The server did not acknowledge every synchronized message.");
        }
        await dependencies.markSynced(ids);
        synced += ids.length;
      } catch (error) {
        await dependencies.markFailed(ids);
        throw error;
      }
      if (pending.length < SYNC_BATCH_SIZE) break;
    }
    return { attempted, synced };
  } finally {
    try {
      await dependencies.releaseLease(sessionKey, ownerId);
    } catch {
      // The bounded lease expires by itself; do not mask a successful or retryable sync result.
    }
  }
}
