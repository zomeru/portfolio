import { z } from "zod";

import { parseEnv } from "#utils";

const DEFAULT_PROJECT_ID = "fvmu1iv8";
const DEFAULT_APP_ID = "c8bcdbwo8f790dksxt7x57yy";
const SANITY_DATASETS = ["development", "production"] as const;

const sanityDatasets = z.enum(SANITY_DATASETS);

const sanityDatasetMap = sanityDatasets.enum;

const sanitySchema = z.object({
  SANITY_PROJECT_ID: z
    .string()
    .optional()
    .transform((value) => value || DEFAULT_PROJECT_ID),
  SANITY_DATASET: sanityDatasets.default("development"),
  SANITY_APP_ID: z
    .string()
    .optional()
    .transform((value) => value || DEFAULT_APP_ID),
});

export type SanityEnv = z.infer<typeof sanitySchema>;

export function getSanityEnv(source: NodeJS.ProcessEnv = process.env) {
  const environment = parseEnv(sanitySchema, source);
  return {
    projectId: environment.SANITY_PROJECT_ID,
    dataset: environment.SANITY_DATASET,
    datasetMap: sanityDatasetMap,
    appId: environment.SANITY_APP_ID,
  } as const;
}
