import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type BlogPost = {
  body: string;
  slug: { current: string };
};

const CHECK_ONLY = process.argv.includes("--check");
const dataFile = resolve(dirname(fileURLToPath(import.meta.url)), "../data/blog.json");
const fencePattern = /```[^\n]*\n([\s\S]*?)```/g;

function hasFileExtension(code: string, extensions: string[]) {
  const pattern = new RegExp(`\\.(${extensions.join("|")})(?:\\b|$)`, "i");
  return pattern.test(code.split("\n").slice(0, 4).join("\n"));
}

function withoutLeadingComments(code: string) {
  return code
    .split("\n")
    .filter((line) => !/^\s*(?:\/\/|#(?!!))/.test(line))
    .join("\n")
    .trim();
}

function isJson(code: string) {
  try {
    JSON.parse(withoutLeadingComments(code));
    return true;
  } catch {
    return false;
  }
}

function detectLanguage(code: string) {
  const value = code.trim();
  const lines = value.split("\n");
  const uncommented = withoutLeadingComments(value);
  const firstLine = uncommented.split("\n")[0]?.trim() ?? "";

  if (
    (/^(?:\+[-+]+\+|\|)/m.test(value) || /(?:--->|<---)/.test(value)) &&
    !/\b(?:const|let|import|export|function|class|interface)\b/.test(value)
  ) {
    return "text";
  }

  if (
    /^(?:Permissions-Policy|Content-Security-Policy|Authorization|Accept|Content-Type):/i.test(
      value,
    )
  ) {
    return "http";
  }

  const hasDockerFrom = lines.some((line) => /^\s*FROM\s+\S+/i.test(line));
  const isDockerfile = /(?:^|[/\s])Dockerfile\b/i.test(lines.slice(0, 4).join("\n"));
  if (hasDockerFrom && (isDockerfile || /^FROM\s+\S+/i.test(firstLine))) return "dockerfile";

  if (isJson(value)) return "json";
  if (hasFileExtension(value, ["json", "jsonc"])) return "jsonc";
  if (/^\{/.test(uncommented) && /(?:\\"|")[\w$-]+(?:\\"|")\s*:/.test(uncommented)) {
    return "jsonc";
  }

  if (hasFileExtension(value, ["ya?ml"])) return "yaml";
  if (
    /^(?:name|on|jobs|steps|services|permissions|apiVersion|kind|spec|build|release|run):\s/m.test(
      uncommented,
    ) &&
    !/\b(?:const|let|var|import|export|function|interface|class)\b/.test(uncommented)
  ) {
    return "yaml";
  }

  if (hasFileExtension(value, ["toml"])) return "toml";
  if (/^\[[\w.-]+\]\s*$/m.test(value) && /^\s*[\w.-]+\s*=\s*.+$/m.test(value)) return "toml";

  if (hasFileExtension(value, ["bazelrc", "bzl"])) return "starlark";
  if (/^(?:build|test|run)(?::[\w-]+)?\s+--[\w-]+/m.test(uncommented)) return "starlark";

  if (hasFileExtension(value, ["prisma"])) return "prisma";
  if (
    /^(?:generator|datasource|model|enum)\s+\w+\s*\{/m.test(uncommented) &&
    /\b(?:provider|@id|@default|@relation)\b/.test(uncommented)
  ) {
    return "prisma";
  }

  if (
    /^(?:\s*--.*\n\s*)*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|EXPLAIN|GRANT|REVOKE|BEGIN|DO)\b/i.test(
      value,
    )
  ) {
    return "sql";
  }

  if (hasFileExtension(value, ["astro"])) return "astro";
  if (/^---\s*\n[\s\S]+?\n---\s*\n/.test(value) && /<\w/.test(value)) return "astro";

  if (/^graph\s+(?:TD|TB|BT|RL|LR)\b/.test(uncommented)) return "mermaid";

  if (/^<script\s+setup(?:\s+lang=["']ts["'])?/i.test(value)) return "vue";
  if (/^<!doctype html>|^<html\b/i.test(value)) return "html";
  if (/^@!\s+extends\(/.test(value)) return "html";

  if (hasFileExtension(value, ["css", "scss"])) return "css";
  if (
    /(?:^|\n)\s*(?:[.#][\w-]+|[a-z][\w-]*(?:\s+[a-z.#][\w-]*)*)\s*\{/.test(value) &&
    /[\w-]+\s*:\s*[^;\n]+;/.test(value) &&
    !/\b(?:const|let|var|import|export|function|interface|class|return)\b/.test(value)
  ) {
    return "css";
  }

  if (
    /^(?:terraform|provider|resource|module|variable|output)\s+(?:"[^"]+"\s*){0,2}\{/m.test(
      uncommented,
    )
  ) {
    return "hcl";
  }

  if (hasFileExtension(value, ["py"])) return "python";
  if (/\bfunc\s+\w+\([^)]*\)\s*->\s*\w+/.test(value)) return "swift";
  if (/^(?:from\s+[\w.]+\s+import|def\s+\w+\(|class\s+\w+.*:)/m.test(uncommented)) {
    return "python";
  }

  if (/^\s*(?:#|\/\/)\s*\.gitignore\b/m.test(value)) return "ignore";

  if (hasFileExtension(value, ["sh", "bash", "zsh"]) || /^#!.*(?:ba|z|fi)?sh\b/.test(value)) {
    return "bash";
  }
  const environmentOnly = uncommented
    .split("\n")
    .filter(Boolean)
    .every((line) => /^[A-Z_][A-Z0-9_]*=\S/.test(line));
  if (environmentOnly) return "bash";
  if (
    /^(?:npm|npx|pnpm|yarn|bunx?|node|deno|git|curl|wget|cd|mkdir|touch|cp|mv|docker|sanity|fly|flyctl|gcloud|az|heroku|sails|nest|turbo|bazel)\b/.test(
      firstLine,
    ) ||
    /^export\s+[A-Z_][A-Z0-9_]*=/.test(firstLine)
  ) {
    return "bash";
  }

  if (hasFileExtension(value, ["tsx"])) return "tsx";
  const hasJsx =
    /<[A-Z][\w.]*\s+[\w:-]+(?:=|\s)/.test(value) ||
    /<[A-Z][\w.]*\s*\/>/.test(value) ||
    /<([A-Z][\w.]*)>[\s\S]*<\/\1>/.test(value) ||
    /<(?:div|main|section|button|form|input|span|p|h[1-6]|Link)\b/.test(value) ||
    /return\s*(?:\(|)\s*<[A-Z]/.test(value);
  if (hasJsx) return "tsx";

  if (hasFileExtension(value, ["ts", "mts", "cts"])) return "typescript";
  if (
    /\b(?:import|export|const|let|var|async|await|function|class|interface|type|new|require\(|module\.exports|Bun\.|Deno\.)\b/.test(
      value,
    )
  ) {
    return "typescript";
  }

  return "text";
}

async function main() {
  const posts = JSON.parse(await readFile(dataFile, "utf8")) as BlogPost[];
  const counts = new Map<string, number>();
  const unresolved: Array<{ preview: string; slug: string }> = [];
  let changed = 0;
  let fences = 0;

  for (const post of posts) {
    post.body = post.body.replace(fencePattern, (original, code: string) => {
      fences += 1;
      const language = detectLanguage(code);
      counts.set(language, (counts.get(language) ?? 0) + 1);
      if (
        language === "text" &&
        !/^(?:\+[-+]+\+|\||.*(?:--->|<---)|(?:\/\/|#)\s*Procfile\b)/m.test(code.trim())
      ) {
        unresolved.push({ slug: post.slug.current, preview: code.trim().split("\n")[0] ?? "" });
      }

      const replacement = `\`\`\`${language}\n${code}\`\`\``;
      if (replacement !== original) changed += 1;
      return replacement;
    });
  }

  console.log(`Classified ${fences} code fences; ${changed} label(s) differ.`);
  console.log(Object.fromEntries([...counts].sort(([left], [right]) => left.localeCompare(right))));

  if (unresolved.length > 0) {
    console.error("Unresolved non-diagram code fences:");
    for (const item of unresolved) console.error(`- ${item.slug}: ${item.preview}`);
    process.exitCode = 1;
    return;
  }

  if (CHECK_ONLY) {
    console.log("Check complete. No files were written.");
    return;
  }

  await writeFile(dataFile, `${JSON.stringify(posts, null, 2)}\n`);
  console.log(`Updated ${dataFile}.`);
}

void main();
