import { getDatabaseEnv } from "@portfolio/env/database";
import { defineConfig } from "drizzle-kit";

const databaseEnv = getDatabaseEnv();

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // Use direct connection for cli actions if available
    url: databaseEnv.directUrl ?? databaseEnv.url,
  },
});
