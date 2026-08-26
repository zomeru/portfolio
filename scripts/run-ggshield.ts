import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const repositoryRoot = resolve(process.cwd());
const result = spawnSync(
  "ggshield",
  ["secret", "scan", "repo", "--ignore-known-secrets", repositoryRoot],
  {
    cwd: repositoryRoot,
    stdio: "inherit",
  },
);

if (result.error) {
  const errorCode = (result.error as NodeJS.ErrnoException).code;
  if (errorCode === "ENOENT" || errorCode === "EACCES") {
    console.error(
      "ggshield was not found or is not executable. Install it, run `ggshield auth login`, " +
        "and try again.",
    );
  } else {
    console.error(result.error.message);
  }
  process.exitCode = 1;
} else if (result.status !== 0) {
  process.exitCode = result.status ?? 1;
}
