import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const applicationErrorSeverity = pgEnum("application_error_severity", ["error", "warning"]);

export const applicationErrorStatus = pgEnum("application_error_status", [
  "open",
  "resolved",
  "ignored",
]);

export type ApplicationErrorMetadata = Record<string, unknown>;

export const applicationErrors = pgTable(
  "application_errors",
  {
    id: uuid().defaultRandom().primaryKey(),
    fingerprint: varchar({ length: 64 }).notNull(),
    severity: applicationErrorSeverity().notNull().default("error"),
    name: varchar({ length: 255 }).notNull(),
    message: text().notNull(),
    stack: text(),
    source: varchar({ length: 1_024 }),
    route: varchar({ length: 512 }),
    method: varchar({ length: 16 }),
    requestId: varchar("request_id", { length: 255 }),
    userAgent: varchar("user_agent", { length: 1_024 }),
    environment: varchar({ length: 64 }).notNull(),
    service: varchar({ length: 100 }).notNull(),
    errorCode: varchar("error_code", { length: 255 }),
    metadata: jsonb().$type<ApplicationErrorMetadata>().notNull().default({}),
    cause: jsonb().$type<ApplicationErrorMetadata>(),
    status: applicationErrorStatus().notNull().default("open"),
    occurrenceCount: integer("occurrence_count").notNull().default(1),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("application_errors_fingerprint_idx").on(table.fingerprint),
    index("application_errors_last_seen_id_idx").on(table.lastSeenAt, table.id),
    index("application_errors_status_last_seen_id_idx").on(
      table.status,
      table.lastSeenAt,
      table.id,
    ),
    index("application_errors_severity_last_seen_id_idx").on(
      table.severity,
      table.lastSeenAt,
      table.id,
    ),
  ],
);
