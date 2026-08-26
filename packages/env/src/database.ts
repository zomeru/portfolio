import { z } from "zod";

import { parseEnv } from "#utils";

const databaseSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  DATABASE_DIRECT_URL: z.string().min(1).optional(),
});

export type DatabaseEnv = z.infer<typeof databaseSchema>;

export function getDatabaseEnv(source: NodeJS.ProcessEnv = process.env) {
  const environment = parseEnv(databaseSchema, source);
  return {
    url: environment.DATABASE_URL,
    directUrl: environment.DATABASE_DIRECT_URL,
  } as const;
}
