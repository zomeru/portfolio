import { ASSISTANT_EMBEDDING } from "@portfolio/env/embedding";
import { pgTable, primaryKey, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";

export const blogGenerationLocks = pgTable("blog_generation_locks", {
  scope: text().primaryKey(),
  token: uuid().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const blogFingerprints = pgTable(
  "blog_fingerprints",
  {
    scope: text().notNull(),
    documentId: text("document_id").notNull(),
    revision: text().notNull(),
    model: text().notNull(),
    topic: vector({ dimensions: ASSISTANT_EMBEDDING.dimensions }),
    body: vector({ dimensions: ASSISTANT_EMBEDDING.dimensions }),
  },
  (table) => [primaryKey({ columns: [table.scope, table.documentId] })],
);
