import { getDatabaseEnv } from "@portfolio/env/database";
import type { BatchItem } from "drizzle-orm/batch";
import { drizzle as postgres } from "drizzle-orm/postgres";
import { drizzle as neonHttp } from "drizzle-orm/postgres/neon-http";

function createDatabase() {
  const { url } = getDatabaseEnv();
  const host = new URL(url).hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") {
    return postgres({ connection: { url, max: 4, idleTimeoutMillis: 1_000 } });
  }
  return neonHttp(url);
}

type Database = ReturnType<typeof createDatabase>;

let database: Database | undefined;

function getDatabase(): Database {
  database ??= createDatabase();

  return database;
}

export const db: Database = new Proxy({} as Database, {
  get(_target, property: keyof Database) {
    return getDatabase()[property];
  },
});

export function batch<Queries extends Readonly<[BatchItem<"pg">, ...BatchItem<"pg">[]]>>(
  queries: Queries,
) {
  const connection = getDatabase();
  return "bulkInsert" in connection ? connection.batch(queries) : connection.batch(queries);
}
