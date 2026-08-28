import { z } from "zod";

import { parseEnv } from "#utils";

const sanityRevalidateServerSchema = z.object({
  SANITY_REVALIDATE_SECRET: z
    .string()
    .min(32, "SANITY_REVALIDATE_SECRET must contain at least 32 characters."),
});

export type SanityRevalidateServerEnv = z.infer<typeof sanityRevalidateServerSchema>;

export function getSanityRevalidateServerEnv(source: NodeJS.ProcessEnv = process.env) {
  const environment = parseEnv(sanityRevalidateServerSchema, source);
  return { secret: environment.SANITY_REVALIDATE_SECRET } as const;
}
