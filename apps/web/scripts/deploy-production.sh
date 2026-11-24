#!/bin/sh
set -eu

if [ "${WORKERS_CI:-}" = 1 ]; then
  printf '%s\n' "Use the GitHub Actions production release to migrate and backfill before deploying." >&2
  exit 1
fi

pnpm run build:production
exec pnpm exec wrangler deploy --env production "$@"
