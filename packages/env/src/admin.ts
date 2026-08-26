import { z } from "zod";

import { parseEnv } from "#utils";

const adminSchema = z.object({
  ADMIN_ACCESS_KEY: z.string().min(32, "ADMIN_ACCESS_KEY must contain at least 32 characters."),
});

export type AdminEnv = z.infer<typeof adminSchema>;

export function getAdminEnv(source: NodeJS.ProcessEnv = process.env) {
  const environment = parseEnv(adminSchema, source);
  return { accessKey: environment.ADMIN_ACCESS_KEY } as const;
}
