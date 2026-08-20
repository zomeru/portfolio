import { z } from "zod";
import { parseEnv } from "./utils";

const DEFAULT_PROJECT_ID = "fvmu1iv8";

const sanitySchema = z.object({
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().default(DEFAULT_PROJECT_ID),
  NEXT_PUBLIC_SANITY_DATASET: z.enum(["development", "production"]).default("development"),
});

export type SanityEnv = z.infer<typeof sanitySchema>;

export function getSanityEnv(source: NodeJS.ProcessEnv = process.env) {
  const environment = parseEnv(sanitySchema, source);
  return {
    projectId: environment.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: environment.NEXT_PUBLIC_SANITY_DATASET,
  } as const;
}
