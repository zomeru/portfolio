import { randomUUID } from "node:crypto";

import { ASSISTANT_EMBEDDING } from "@portfolio/env/embedding";
import { and, cosineDistance, eq, inArray, sql } from "drizzle-orm";

import { db } from "../client";
import { blogFingerprints, blogGenerationLocks } from "../db/schema/blog-generation";

// A request gets a fresh lease immediately before sending the bounded Sanity mutation.
const leaseExpiry = sql`now() + interval '5 minutes'`;

export async function acquireBlogGenerationLock(scope: string) {
  const token = randomUUID();
  const [lease] = await db
    .insert(blogGenerationLocks)
    .values({ scope, token, expiresAt: leaseExpiry })
    .onConflictDoUpdate({
      target: blogGenerationLocks.scope,
      set: { token, expiresAt: leaseExpiry },
      setWhere: sql`${blogGenerationLocks.expiresAt} <= now()`,
    })
    .returning({ token: blogGenerationLocks.token });
  return lease?.token;
}

export async function refreshBlogGenerationLock(scope: string, token: string) {
  const [lease] = await db
    .update(blogGenerationLocks)
    .set({ expiresAt: leaseExpiry })
    .where(
      and(
        eq(blogGenerationLocks.scope, scope),
        eq(blogGenerationLocks.token, token),
        sql`${blogGenerationLocks.expiresAt} > now()`,
      ),
    )
    .returning({ token: blogGenerationLocks.token });
  return Boolean(lease);
}

export async function releaseBlogGenerationLock(scope: string, token: string) {
  await db
    .delete(blogGenerationLocks)
    .where(and(eq(blogGenerationLocks.scope, scope), eq(blogGenerationLocks.token, token)));
}

export function listBlogFingerprintRevisions(scope: string) {
  return db
    .select({ documentId: blogFingerprints.documentId, revision: blogFingerprints.revision })
    .from(blogFingerprints)
    .where(
      and(eq(blogFingerprints.scope, scope), eq(blogFingerprints.model, ASSISTANT_EMBEDDING.model)),
    );
}

export async function writeBlogFingerprints(
  scope: string,
  entries: {
    documentId: string;
    revision: string;
    topic: number[] | null;
    body: number[] | null;
  }[],
) {
  if (entries.length === 0) return;
  await db
    .insert(blogFingerprints)
    .values(entries.map((entry) => ({ ...entry, scope, model: ASSISTANT_EMBEDDING.model })))
    .onConflictDoUpdate({
      target: [blogFingerprints.scope, blogFingerprints.documentId],
      set: {
        revision: sql`excluded.revision`,
        model: sql`excluded.model`,
        topic: sql`excluded.topic`,
        body: sql`excluded.body`,
      },
    });
}

export function findSimilarBlogFingerprints(input: {
  scope: string;
  documentIds: string[];
  topic: number[];
  body: number[];
  maximumTopicDistance: number;
  maximumBodyDistance: number;
}) {
  const topic = cosineDistance(blogFingerprints.topic, input.topic);
  const body = cosineDistance(blogFingerprints.body, input.body);
  return db
    .select({ documentId: blogFingerprints.documentId })
    .from(blogFingerprints)
    .where(
      and(
        eq(blogFingerprints.scope, input.scope),
        eq(blogFingerprints.model, ASSISTANT_EMBEDDING.model),
        inArray(blogFingerprints.documentId, input.documentIds),
        sql`(${topic} <= ${input.maximumTopicDistance} OR ${body} <= ${input.maximumBodyDistance})`,
      ),
    )
    .orderBy(sql`least(${topic}, ${body})`)
    .limit(3);
}
