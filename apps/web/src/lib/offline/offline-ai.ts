import type { InitProgressReport, WebWorkerMLCEngine } from "@mlc-ai/web-llm";
import type { AskZomerMessage } from "@portfolio/api/types";

import { buildOfflinePrompt, type OfflineKnowledgeMatch } from "./knowledge";

export const OFFLINE_MODEL_ID = "SmolLM2-360M-Instruct-q4f16_1-MLC";
export const OFFLINE_MODEL_LABEL = "SmolLM2 360M";
export const OFFLINE_MODEL_DOWNLOAD_MB = 220;
const REQUIRED_AVAILABLE_BYTES = 550 * 1_024 * 1_024;

let enginePromise: Promise<WebWorkerMLCEngine> | undefined;
let modelWorker: Worker | undefined;
// Bump this URL when the worker source or WebLLM runtime changes so cache-first clients refetch it.
const OFFLINE_WORKER_URL = "/offline-ai-worker.js?v=webllm-0.2.84-1";

export type OfflineAiCompatibility =
  | { supported: true }
  | { reason: "insecure" | "storage" | "webgpu"; supported: false };

export function getOfflineAiCompatibility(): OfflineAiCompatibility {
  if (!window.isSecureContext) return { reason: "insecure", supported: false };
  if (!("gpu" in navigator)) return { reason: "webgpu", supported: false };
  if (!("storage" in navigator) || !("estimate" in navigator.storage)) {
    return { reason: "storage", supported: false };
  }
  return { supported: true };
}

export async function getOfflineModelStorage() {
  const estimate = await navigator.storage.estimate();
  return {
    available: Math.max(0, (estimate.quota ?? 0) - (estimate.usage ?? 0)),
    quota: estimate.quota ?? 0,
    usage: estimate.usage ?? 0,
  };
}

export async function hasInstalledOfflineModel() {
  if (!getOfflineAiCompatibility().supported) return false;
  const { hasModelInCache } = await import("@mlc-ai/web-llm");
  return hasModelInCache(OFFLINE_MODEL_ID);
}

async function createEngine(onProgress?: (report: InitProgressReport) => void) {
  const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
  modelWorker ??= new Worker(OFFLINE_WORKER_URL, {
    name: "zomer-offline-ai",
    type: "module",
  });
  return CreateWebWorkerMLCEngine(modelWorker, OFFLINE_MODEL_ID, {
    ...(onProgress ? { initProgressCallback: onProgress } : {}),
    logLevel: "WARN",
  });
}

async function getEngine(onProgress?: (report: InitProgressReport) => void) {
  enginePromise ??= createEngine(onProgress).catch((error) => {
    enginePromise = undefined;
    modelWorker?.terminate();
    modelWorker = undefined;
    throw error;
  });
  const engine = await enginePromise;
  if (onProgress) engine.setInitProgressCallback(onProgress);
  return engine;
}

export async function installOfflineModel(onProgress: (report: InitProgressReport) => void) {
  const compatibility = getOfflineAiCompatibility();
  if (!compatibility.supported)
    throw new Error(`Offline AI is unsupported: ${compatibility.reason}`);
  const storage = await getOfflineModelStorage();
  if (storage.available < REQUIRED_AVAILABLE_BYTES) {
    throw new Error("There is not enough available browser storage for the offline AI model.");
  }
  if ("persist" in navigator.storage) await navigator.storage.persist().catch(() => false);
  await getEngine(onProgress);
}

export async function removeOfflineModel() {
  const activeEngine = enginePromise ? await enginePromise.catch(() => undefined) : undefined;
  await activeEngine?.unload();
  enginePromise = undefined;
  modelWorker?.terminate();
  modelWorker = undefined;
  const { deleteModelAllInfoInCache } = await import("@mlc-ai/web-llm");
  await deleteModelAllInfoInCache(OFFLINE_MODEL_ID);
}

export async function generateOfflineAnswer(options: {
  history: AskZomerMessage[];
  matches: OfflineKnowledgeMatch[];
  question: string;
}) {
  if (!(await hasInstalledOfflineModel())) {
    throw new Error("The offline AI model has not been installed.");
  }
  const prompt = buildOfflinePrompt(options.question, options.matches, options.history);
  const engine = await getEngine();
  const completion = await engine.chat.completions.create({
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    max_tokens: 320,
    temperature: 0.2,
    top_p: 0.9,
  });
  const content = completion.choices[0]?.message.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("The offline model returned an empty response.");
  }
  return content.trim();
}

export async function interruptOfflineGeneration() {
  const engine = enginePromise ? await enginePromise.catch(() => undefined) : undefined;
  engine?.interruptGenerate();
}
