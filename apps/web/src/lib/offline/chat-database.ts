import type { AskZomerMessage } from "@portfolio/api/types";

import type { SearchItem } from "@/features/search/types/search";

const DATABASE_NAME = "zomer-offline";
const DATABASE_VERSION = 1;
const MESSAGE_STORE = "messages";
const KNOWLEDGE_STORE = "knowledge";
const META_STORE = "meta";
const MAX_CACHED_MESSAGES = 500;
const SYNC_LEASE_MS = 45_000;
const STALE_SYNC_MS = 60_000;

export type LocalMessageSyncState = "failed" | "pending" | "synced" | "syncing";

export type StoredChatMessage = {
  createdAt: string;
  id: string;
  message: AskZomerMessage;
  retryCount: number;
  sessionKey: string;
  syncState: LocalMessageSyncState;
  updatedAt: number;
};

type KnowledgeRecord = {
  items: SearchItem[];
  locale: string;
  updatedAt: number;
  version: 1;
};

type MetaRecord = {
  key: string;
  value: unknown;
};

type SyncLease = {
  expiresAt: number;
  ownerId: string;
};

export type OfflineModelState = {
  installedAt: string;
  modelId: string;
};

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error), { once: true });
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener("abort", () => reject(transaction.error), { once: true });
    transaction.addEventListener("error", () => reject(transaction.error), { once: true });
  });
}

let databasePromise: Promise<IDBDatabase> | undefined;

function openOfflineDatabase() {
  if (!databasePromise) {
    const pending = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.addEventListener(
        "upgradeneeded",
        () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(MESSAGE_STORE)) {
            const messages = database.createObjectStore(MESSAGE_STORE, { keyPath: "id" });
            messages.createIndex("session-created", ["sessionKey", "createdAt"]);
            messages.createIndex("session-sync", ["sessionKey", "syncState"]);
          }
          if (!database.objectStoreNames.contains(KNOWLEDGE_STORE)) {
            database.createObjectStore(KNOWLEDGE_STORE, { keyPath: "locale" });
          }
          if (!database.objectStoreNames.contains(META_STORE)) {
            database.createObjectStore(META_STORE, { keyPath: "key" });
          }
        },
        { once: true },
      );
      request.addEventListener("success", () => resolve(request.result), { once: true });
      request.addEventListener("error", () => reject(request.error), { once: true });
      request.addEventListener(
        "blocked",
        () => reject(new Error("Offline storage upgrade is blocked by another open tab.")),
        { once: true },
      );
    });
    databasePromise = pending.catch((error: unknown) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

function createdAtOf(message: AskZomerMessage) {
  return message.metadata?.createdAt ?? new Date().toISOString();
}

export async function cacheServerMessages(sessionKey: string, messages: AskZomerMessage[]) {
  const database = await openOfflineDatabase();
  const transaction = database.transaction(MESSAGE_STORE, "readwrite");
  const store = transaction.objectStore(MESSAGE_STORE);
  const now = Date.now();

  for (const message of messages) {
    const existing = await requestResult(store.get(message.id) as IDBRequest<StoredChatMessage>);
    store.put({
      createdAt: createdAtOf(message),
      id: message.id,
      message,
      retryCount: existing?.retryCount ?? 0,
      sessionKey,
      syncState: "synced",
      updatedAt: now,
    } satisfies StoredChatMessage);
  }
  await transactionDone(transaction);
  await pruneSyncedMessages(sessionKey);
}

export async function putLocalMessage(
  sessionKey: string,
  message: AskZomerMessage,
  syncState: Exclude<LocalMessageSyncState, "syncing"> = "pending",
) {
  const database = await openOfflineDatabase();
  const transaction = database.transaction(MESSAGE_STORE, "readwrite");
  const store = transaction.objectStore(MESSAGE_STORE);
  const existing = await requestResult(store.get(message.id) as IDBRequest<StoredChatMessage>);
  store.put({
    createdAt: createdAtOf(message),
    id: message.id,
    message,
    retryCount: existing?.retryCount ?? 0,
    sessionKey,
    syncState: existing?.syncState === "synced" ? "synced" : syncState,
    updatedAt: Date.now(),
  } satisfies StoredChatMessage);
  await transactionDone(transaction);
}

export async function getCachedMessages(sessionKey: string) {
  const database = await openOfflineDatabase();
  const transaction = database.transaction(MESSAGE_STORE, "readonly");
  const index = transaction.objectStore(MESSAGE_STORE).index("session-created");
  const range = IDBKeyRange.bound([sessionKey, ""], [sessionKey, "\uffff"]);
  const records = await requestResult(index.getAll(range) as IDBRequest<StoredChatMessage[]>);
  await transactionDone(transaction);
  return [...records].sort(
    (left, right) =>
      left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
  );
}

export async function getPendingMessages(sessionKey: string, limit = 50) {
  const records = await getCachedMessages(sessionKey);
  const staleBefore = Date.now() - STALE_SYNC_MS;
  return records
    .filter(
      (record) =>
        record.syncState === "pending" ||
        record.syncState === "failed" ||
        (record.syncState === "syncing" && record.updatedAt < staleBefore),
    )
    .slice(0, limit);
}

async function updateMessageStates(
  messageIds: string[],
  update: (record: StoredChatMessage) => StoredChatMessage,
) {
  if (messageIds.length === 0) return;
  const database = await openOfflineDatabase();
  const transaction = database.transaction(MESSAGE_STORE, "readwrite");
  const store = transaction.objectStore(MESSAGE_STORE);
  for (const messageId of messageIds) {
    const record = await requestResult(store.get(messageId) as IDBRequest<StoredChatMessage>);
    if (record) store.put(update(record));
  }
  await transactionDone(transaction);
}

export function markMessagesSyncing(messageIds: string[]) {
  const now = Date.now();
  return updateMessageStates(messageIds, (record) => ({
    ...record,
    syncState: "syncing",
    updatedAt: now,
  }));
}

export function markMessagesSynced(messageIds: string[]) {
  const now = Date.now();
  return updateMessageStates(messageIds, (record) => ({
    ...record,
    retryCount: 0,
    syncState: "synced",
    updatedAt: now,
  }));
}

export function markMessagesFailed(messageIds: string[]) {
  const now = Date.now();
  return updateMessageStates(messageIds, (record) => ({
    ...record,
    retryCount: record.retryCount + 1,
    syncState: "failed",
    updatedAt: now,
  }));
}

async function pruneSyncedMessages(sessionKey: string) {
  const records = await getCachedMessages(sessionKey);
  const excess = records.length - MAX_CACHED_MESSAGES;
  if (excess <= 0) return;
  const removable = records.filter((record) => record.syncState === "synced").slice(0, excess);
  if (removable.length === 0) return;

  const database = await openOfflineDatabase();
  const transaction = database.transaction(MESSAGE_STORE, "readwrite");
  const store = transaction.objectStore(MESSAGE_STORE);
  for (const record of removable) store.delete(record.id);
  await transactionDone(transaction);
}

export async function storeOfflineKnowledge(locale: string, items: SearchItem[]) {
  const database = await openOfflineDatabase();
  const transaction = database.transaction(KNOWLEDGE_STORE, "readwrite");
  transaction.objectStore(KNOWLEDGE_STORE).put({
    items,
    locale,
    updatedAt: Date.now(),
    version: 1,
  } satisfies KnowledgeRecord);
  await transactionDone(transaction);
}

export async function getOfflineKnowledge(locale: string) {
  const database = await openOfflineDatabase();
  const transaction = database.transaction(KNOWLEDGE_STORE, "readonly");
  const record = await requestResult(
    transaction.objectStore(KNOWLEDGE_STORE).get(locale) as IDBRequest<KnowledgeRecord>,
  );
  await transactionDone(transaction);
  return record?.version === 1 ? record : undefined;
}

export async function getOfflineModelState() {
  const database = await openOfflineDatabase();
  const transaction = database.transaction(META_STORE, "readonly");
  const record = await requestResult(
    transaction.objectStore(META_STORE).get("offline-model") as IDBRequest<MetaRecord>,
  );
  await transactionDone(transaction);
  return record?.value as OfflineModelState | undefined;
}

export async function setOfflineModelState(state: OfflineModelState | undefined) {
  const database = await openOfflineDatabase();
  const transaction = database.transaction(META_STORE, "readwrite");
  const store = transaction.objectStore(META_STORE);
  if (state) store.put({ key: "offline-model", value: state } satisfies MetaRecord);
  else store.delete("offline-model");
  await transactionDone(transaction);
}

export async function acquireSyncLease(sessionKey: string, ownerId: string) {
  const database = await openOfflineDatabase();
  const transaction = database.transaction(META_STORE, "readwrite");
  const store = transaction.objectStore(META_STORE);
  const key = `sync-lease:${sessionKey}`;
  const record = await requestResult(store.get(key) as IDBRequest<MetaRecord>);
  const lease = record?.value as SyncLease | undefined;
  const now = Date.now();
  const acquired = !lease || lease.expiresAt <= now || lease.ownerId === ownerId;
  if (acquired) {
    store.put({
      key,
      value: { expiresAt: now + SYNC_LEASE_MS, ownerId } satisfies SyncLease,
    } satisfies MetaRecord);
  }
  await transactionDone(transaction);
  return acquired;
}

export async function releaseSyncLease(sessionKey: string, ownerId: string) {
  const database = await openOfflineDatabase();
  const transaction = database.transaction(META_STORE, "readwrite");
  const store = transaction.objectStore(META_STORE);
  const key = `sync-lease:${sessionKey}`;
  const record = await requestResult(store.get(key) as IDBRequest<MetaRecord>);
  const lease = record?.value as SyncLease | undefined;
  if (lease?.ownerId === ownerId) store.delete(key);
  await transactionDone(transaction);
}

export async function deleteOfflineDatabaseForTests() {
  const database = await databasePromise;
  database?.close();
  databasePromise = undefined;
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);
    request.addEventListener("success", () => resolve(), { once: true });
    request.addEventListener("error", () => reject(request.error), { once: true });
  });
}
