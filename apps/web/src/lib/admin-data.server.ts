import "@tanstack/react-start/server-only";
import { logError } from "@portfolio/api/logging";
import type {
  AdminErrorDetail,
  AdminErrorIssuePage,
  AdminErrorSeverity,
  AdminErrorStatus,
} from "@portfolio/api/types";
import { notFound } from "@tanstack/react-router";

import type { WebhookSummary } from "@/components/admin/webhook-manager";

import { getAdminAccessSessionToken, isAdminAccessAuthenticated } from "./admin-access";
import { getAdminSessionToken } from "./admin-session";
import type { ErrorSearch } from "./admin.functions";
import { serverClient } from "./api-server";

type KnowledgeIndexStatus = {
  documents: number;
  chunks: number;
  latestRun: null | {
    status: string;
    startedAt: string;
    completedAt: string | null;
  };
};

export type NotificationSummary = {
  counts: { email: number; push: number; webhook: number };
  latestEvent: null | {
    occurredAt: string;
    payload: { data: { blog: { title: string } } };
  };
  deliveries: Array<{
    channel: "email" | "push" | "webhook";
    status: "pending" | "processing" | "delivered" | "failed";
    count: number;
  }>;
};

async function loadKnowledgeStatus(token: string) {
  try {
    const response = await serverClient.api.admin.ai.status.$get(
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) return null;
    return (await response.json()) as KnowledgeIndexStatus;
  } catch (error) {
    logError("admin knowledge status could not be loaded", error, {
      operation: "web.admin.loadKnowledgeStatus",
    });
    return null;
  }
}

async function loadNotificationSummary(token: string) {
  try {
    const response = await serverClient.api.notifications.admin.summary.$get(
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) return null;
    return (await response.json()) as NotificationSummary;
  } catch (error) {
    logError("admin notification summary could not be loaded", error, {
      operation: "web.admin.loadNotificationSummary",
    });
    return null;
  }
}

async function loadWebhookSummaries(token: string) {
  try {
    const response = await serverClient.api.notifications.webhooks.$get(
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as { webhooks: WebhookSummary[] };
    return payload.webhooks;
  } catch (error) {
    logError("admin webhook destinations could not be loaded", error, {
      operation: "web.admin.loadWebhookSummaries",
    });
    return null;
  }
}

export async function getDashboard() {
  if (!(await isAdminAccessAuthenticated())) return { hasPageAccess: false } as const;
  const [publishingToken, reindexToken] = await Promise.all([
    getAdminSessionToken("blog-generation"),
    getAdminSessionToken("ai-reindex"),
  ]);
  const [status, notificationSummary, webhookSummaries] = await Promise.all([
    reindexToken ? loadKnowledgeStatus(reindexToken) : null,
    publishingToken ? loadNotificationSummary(publishingToken) : null,
    publishingToken ? loadWebhookSummaries(publishingToken) : null,
  ]);

  return {
    hasPageAccess: true,
    canPublish: Boolean(publishingToken),
    canReindex: Boolean(reindexToken),
    status,
    notificationSummary,
    webhookSummaries,
  } as const;
}

async function loadIssues(
  token: string,
  options: {
    cursor?: string;
    q?: string;
    severity?: AdminErrorSeverity;
    status?: AdminErrorStatus;
  },
) {
  try {
    const response = await serverClient.api.admin.errors.$get(
      {
        query: {
          ...(options.cursor ? { cursor: options.cursor } : {}),
          ...(options.q ? { q: options.q } : {}),
          ...(options.severity ? { severity: options.severity } : {}),
          ...(options.status ? { status: options.status } : {}),
        },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) return null;
    return (await response.json()) as AdminErrorIssuePage;
  } catch (error) {
    logError("admin error issues could not be loaded", error, {
      operation: "web.admin.errors.loadIssues",
    });
    return null;
  }
}

export async function getErrors(raw: ErrorSearch) {
  const token = await getAdminAccessSessionToken();
  if (!token) return { hasAccess: false } as const;
  const status = ["open", "resolved", "ignored"].includes(raw.status ?? "")
    ? (raw.status as AdminErrorStatus)
    : undefined;
  const severity = ["error", "warning"].includes(raw.severity ?? "")
    ? (raw.severity as AdminErrorSeverity)
    : undefined;
  const q = raw.q?.trim().slice(0, 200) || undefined;
  const cursor = raw.cursor?.slice(0, 512) || undefined;
  const page = await loadIssues(token, {
    ...(cursor ? { cursor } : {}),
    ...(q ? { q } : {}),
    ...(severity ? { severity } : {}),
    ...(status ? { status } : {}),
  });

  return { hasAccess: true, status, severity, q, cursor, page } as const;
}

async function loadIssue(token: string, id: string) {
  try {
    const response = await serverClient.api.admin.errors[":id"].$get(
      { param: { id } },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (response.status === 404) return undefined;
    if (!response.ok) return null;
    const payload = (await response.json()) as { issue: AdminErrorDetail };
    return payload.issue;
  } catch (error) {
    logError("admin error issue could not be loaded", error, {
      operation: "web.admin.errors.loadIssue",
      issueId: id,
    });
    return null;
  }
}

export async function getErrorDetail(id: string) {
  const token = await getAdminAccessSessionToken();
  if (!token) return { hasAccess: false } as const;
  const issue = await loadIssue(token, id);
  if (issue === undefined) throw notFound();
  if (!issue) return { hasAccess: true, issue: null } as const;
  const { metadata, cause, ...detail } = issue;
  return {
    hasAccess: true,
    issue: {
      ...detail,
      metadata: JSON.stringify(metadata, null, 2),
      cause: cause === null ? null : JSON.stringify(cause, null, 2),
    },
  } as const;
}
