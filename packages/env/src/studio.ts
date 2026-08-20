import { z } from "zod";
import { parseEnv } from "./utils";

const DEFAULT_PROJECT_ID = "vap9ch2u";

const studioSchema = z.object({
  SANITY_STUDIO_PROJECT_ID: z.string().default(DEFAULT_PROJECT_ID),
  SANITY_STUDIO_DATASET: z.enum(["development", "production"]).default("development"),
  SANITY_STUDIO_APP_ID: z.string().min(1).optional(),
});

export type StudioEnv = z.infer<typeof studioSchema>;

export function getStudioEnv(source: NodeJS.ProcessEnv = process.env) {
  const environment = parseEnv(studioSchema, source);
  return {
    projectId: environment.SANITY_STUDIO_PROJECT_ID,
    dataset: environment.SANITY_STUDIO_DATASET,
    appId: environment.SANITY_STUDIO_APP_ID,
  } as const;
}
