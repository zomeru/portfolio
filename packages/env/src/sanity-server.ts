import { z } from "zod";
import { parseEnv } from "./utils";

const sanityServerSchema = z.object({
  SANITY_API_TOKEN: z.string().min(1, "SANITY_API_TOKEN is required."),
});

export type SanityServerEnv = z.infer<typeof sanityServerSchema>;

export function getSanityServerEnv(source: NodeJS.ProcessEnv = process.env) {
  const environment = parseEnv(sanityServerSchema, source);
  return { token: environment.SANITY_API_TOKEN } as const;
}
