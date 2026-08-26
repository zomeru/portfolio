import { z } from "zod";

import { parseEnv } from "#utils";

const githubServerSchema = z.object({
  GH_PAT_TOKEN: z.string().trim().min(1, "GH_PAT_TOKEN is required."),
});

export type GithubServerEnv = z.infer<typeof githubServerSchema>;

export function getGithubServerEnv(source: NodeJS.ProcessEnv = process.env) {
  const environment = parseEnv(githubServerSchema, source);
  return { token: environment.GH_PAT_TOKEN } as const;
}
