import { getDatabaseEnv } from "@portfolio/env/database";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

export function createDatabase(): NodePgDatabase {
  return drizzle(getDatabaseEnv().url);
}

export type Database = NodePgDatabase;

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
