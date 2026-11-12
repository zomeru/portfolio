#!/usr/bin/env bash
set -euo pipefail

case "${1:-}" in
  staging|production) target="$1" ;;
  *) printf 'Usage: %s staging|production [Wrangler deploy options]\n' "$0" >&2; exit 1 ;;
esac
shift

cd "$(dirname "${BASH_SOURCE[0]}")/../../.."
node_version="$(< .node-version)"
tool_dir="$(mktemp -d)"
trap 'rm -r -- "$tool_dir"' EXIT

if [[ "$(node --version)" != "v$node_version" ]]; then
  case "$(uname -s)-$(uname -m)" in
    Linux-x86_64) platform=linux-x64; checksum=(sha256sum -c -) ;;
    Darwin-arm64) platform=darwin-arm64; checksum=(shasum -a 256 -c -) ;;
    *) printf 'Unsupported Workers build platform\n' >&2; exit 1 ;;
  esac

  archive="node-v$node_version-$platform.tar.gz"
  release="https://nodejs.org/dist/v$node_version"
  (
    cd "$tool_dir"
    curl --fail --silent --show-error --retry 3 --location --remote-name "$release/$archive"
    curl --fail --silent --show-error --retry 3 --location --remote-name "$release/SHASUMS256.txt"
    awk -v archive="$archive" '$2 == archive' SHASUMS256.txt | "${checksum[@]}"
    tar -xzf "$archive" --strip-components 1
  )
fi

mkdir -p "$tool_dir/bin"
export PATH="$tool_dir/bin:$PATH"
corepack enable --install-directory "$tool_dir/bin" pnpm
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm --filter @portfolio/web run "deploy:$target" "$@"
