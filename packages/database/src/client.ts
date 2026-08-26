import { neon } from "@neondatabase/serverless";
import { getDatabaseEnv } from "@portfolio/env/database";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

function createDatabase(): NeonHttpDatabase {
  const sql = neon(getDatabaseEnv().url);
  return drizzle({ client: sql });
}

type Database = NeonHttpDatabase;

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
