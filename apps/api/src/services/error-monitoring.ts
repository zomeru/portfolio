import {
  findApplicationError,
  listApplicationErrors,
  updateApplicationErrorStatus,
  type ApplicationErrorSeverityValue,
  type ApplicationErrorStatusValue,
} from "@portfolio/database";
import { z } from "zod";

import type {
  AdminErrorDetail,
  AdminErrorIssuePage,
  AdminErrorSeverity,
  AdminErrorStatus,
} from "../types";

const ERROR_ISSUE_PAGE_SIZE = 20;

const errorIssueCursorSchema = z.object({
  id: z.uuid(),
  lastSeenAt: z.iso.datetime({ offset: true }),
});

function encodeCursor(value: { id: string; lastSeenAt: Date }) {
  return Buffer.from(
    JSON.stringify({ id: value.id, lastSeenAt: value.lastSeenAt.toISOString() }),
  ).toString("base64url");
}

export function decodeErrorIssueCursor(value: string) {
  try {
    const parsed = errorIssueCursorSchema.safeParse(
      JSON.parse(Buffer.from(value, "base64url").toString("utf8")),
    );
    if (!parsed.success) return null;
    return { id: parsed.data.id, lastSeenAt: new Date(parsed.data.lastSeenAt) };
  } catch {
    return null;
  }
}

export async function loadErrorIssues(options: {
  status?: AdminErrorStatus;
  severity?: AdminErrorSeverity;
  search?: string;
  cursor?: { id: string; lastSeenAt: Date };
}): Promise<AdminErrorIssuePage> {
  const rows = await listApplicationErrors({
    ...(options.status ? { status: options.status as ApplicationErrorStatusValue } : {}),
    ...(options.severity ? { severity: options.severity as ApplicationErrorSeverityValue } : {}),
    ...(options.search ? { search: options.search } : {}),
    ...(options.cursor ? { cursor: options.cursor } : {}),
    limit: ERROR_ISSUE_PAGE_SIZE,
  });
  const hasMore = rows.length > ERROR_ISSUE_PAGE_SIZE;
  const pageRows = rows.slice(0, ERROR_ISSUE_PAGE_SIZE);
  const oldest = pageRows.at(-1);

  return {
    issues: pageRows.map((row) => ({
      ...row,
      firstSeenAt: row.firstSeenAt.toISOString(),
      lastSeenAt: row.lastSeenAt.toISOString(),
    })),
    nextCursor: hasMore && oldest ? encodeCursor(oldest) : null,
  };
}

export async function loadErrorIssue(id: string): Promise<AdminErrorDetail | null> {
  const record = await findApplicationError(id);
  if (!record) return null;
  return {
    ...record,
    firstSeenAt: record.firstSeenAt.toISOString(),
    lastSeenAt: record.lastSeenAt.toISOString(),
    resolvedAt: record.resolvedAt?.toISOString() ?? null,
  };
}

export function setErrorIssueStatus(id: string, status: AdminErrorStatus) {
  return updateApplicationErrorStatus(id, status as ApplicationErrorStatusValue);
}
