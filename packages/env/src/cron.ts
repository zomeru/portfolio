import { z } from "zod";
import { parseEnv } from "#utils";

const cronSchema = z.object({
  CRON_SECRET: z.string().min(32, "CRON_SECRET must contain at least 32 characters."),
});

export type CronEnv = z.infer<typeof cronSchema>;

export function getCronEnv(source: NodeJS.ProcessEnv = process.env) {
  const environment = parseEnv(cronSchema, source);
  return { secret: environment.CRON_SECRET } as const;
}
