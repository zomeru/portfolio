import { env } from "@portfolio/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // Use direct connection for cli actions if available
    url: env.DATABASE_DIRECT_URL ?? env.DATABASE_URL,
  },
});
