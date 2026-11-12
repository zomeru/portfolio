import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";

import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function readLocalWorkerVars(mode: string): Record<string, string> {
  const workerVars = resolve(import.meta.dirname, ".dev.vars");
  const environment = process.env.CLOUDFLARE_ENV;
  if (existsSync(workerVars) || (environment && existsSync(`${workerVars}.${environment}`))) {
    return {};
  }

  const envFile = mode === "production" ? ".env.production.local" : ".env.local";
  const localEnv = resolve(import.meta.dirname, "../..", envFile);
  if (!existsSync(localEnv)) return {};

  return Object.fromEntries(
    Object.entries(parseEnv(readFileSync(localEnv, "utf8"))).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );
}

export default defineConfig(({ command, isPreview, mode }) => ({
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
      config: ({ vars }) => {
        if (command === "serve" && !isPreview) {
          return { vars: { ...readLocalWorkerVars(mode), ...vars } };
        }
      },
    }),
    tanstackStart({
      serverFns: { base: "/admin/_serverFn" },
      importProtection: {
        behavior: "error",
        client: {
          specifiers: [/^@portfolio\/api(?:$|\/(?!types$))/, /^@portfolio\/env(?:$|\/)/],
        },
      },
    }),
    react(),
    tailwindcss(),
  ],
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
  build: { assetsDir: "_build" },
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
}));
