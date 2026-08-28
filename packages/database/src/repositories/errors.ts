import { and, desc, eq, ilike, lt, or, sql } from "drizzle-orm";

import { db } from "../client";
import { type ApplicationErrorMetadata, applicationErrors } from "../db/schema/errors";

export type ApplicationErrorSeverityValue = (typeof applicationErrors.$inferInsert)["severity"];
export type ApplicationErrorStatusValue = (typeof applicationErrors.$inferInsert)["status"];

export type ApplicationErrorWrite = {
  fingerprint: string;
  severity: ApplicationErrorSeverityValue;
  name: string;
  message: string;
  stack?: string;
  source?: string;
  route?: string;
  method?: string;
  requestId?: string;
  userAgent?: string;
  environment: string;
  service: string;
  errorCode?: string;
  metadata: ApplicationErrorMetadata;
  cause?: ApplicationErrorMetadata;
};

export async function recordApplicationError(value: ApplicationErrorWrite) {
  const now = new Date();
  const [record] = await db
    .insert(applicationErrors)
    .values({ ...value, firstSeenAt: now, lastSeenAt: now })
    .onConflictDoUpdate({
      target: applicationErrors.fingerprint,
      set: {
        severity: value.severity,
        name: value.name,
        message: value.message,
        stack: value.stack,
        source: value.source,
        route: value.route,
        method: value.method,
        requestId: value.requestId,
        userAgent: value.userAgent,
        environment: value.environment,
        service: value.service,
        errorCode: value.errorCode,
        metadata: value.metadata,
        cause: value.cause,
        status: "open",
        occurrenceCount: sql`${applicationErrors.occurrenceCount} + 1`,
        lastSeenAt: now,
        resolvedAt: null,
      },
    })
    .returning({ id: applicationErrors.id });
  return record;
}

export function listApplicationErrors(options: {
  status?: ApplicationErrorStatusValue;
  severity?: ApplicationErrorSeverityValue;
  search?: string;
  cursor?: { id: string; lastSeenAt: Date };
  limit: number;
}) {
  const search = options.search?.trim();
  const searchPattern = search ? `%${search}%` : undefined;

  return db
    .select({
      id: applicationErrors.id,
      severity: applicationErrors.severity,
      name: applicationErrors.name,
      message: applicationErrors.message,
      source: applicationErrors.source,
      route: applicationErrors.route,
      service: applicationErrors.service,
      errorCode: applicationErrors.errorCode,
      status: applicationErrors.status,
      occurrenceCount: applicationErrors.occurrenceCount,
      firstSeenAt: applicationErrors.firstSeenAt,
      lastSeenAt: applicationErrors.lastSeenAt,
    })
    .from(applicationErrors)
    .where(
      and(
        options.status ? eq(applicationErrors.status, options.status) : undefined,
        options.severity ? eq(applicationErrors.severity, options.severity) : undefined,
        searchPattern
          ? or(
              ilike(applicationErrors.name, searchPattern),
              ilike(applicationErrors.message, searchPattern),
              ilike(applicationErrors.source, searchPattern),
              ilike(applicationErrors.route, searchPattern),
              ilike(applicationErrors.errorCode, searchPattern),
            )
          : undefined,
        options.cursor
          ? or(
              lt(applicationErrors.lastSeenAt, options.cursor.lastSeenAt),
              and(
                eq(applicationErrors.lastSeenAt, options.cursor.lastSeenAt),
                lt(applicationErrors.id, options.cursor.id),
              ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(applicationErrors.lastSeenAt), desc(applicationErrors.id))
    .limit(options.limit + 1);
}

export async function findApplicationError(id: string) {
  const [record] = await db
    .select()
    .from(applicationErrors)
    .where(eq(applicationErrors.id, id))
    .limit(1);
  return record;
}

export async function updateApplicationErrorStatus(
  id: string,
  status: ApplicationErrorStatusValue,
) {
  const [record] = await db
    .update(applicationErrors)
    .set({ status, resolvedAt: status === "resolved" ? new Date() : null })
    .where(eq(applicationErrors.id, id))
    .returning({ id: applicationErrors.id, status: applicationErrors.status });
  return record;
}
