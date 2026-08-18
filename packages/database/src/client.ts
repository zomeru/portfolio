import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

export function createDatabase(): NodePgDatabase {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  return drizzle(connectionString);
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
