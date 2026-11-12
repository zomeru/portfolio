import "@tanstack/react-start/server-only";
import { AsyncLocalStorage } from "node:async_hooks";

export const workerContext = new AsyncLocalStorage<{ env: Env; ctx: ExecutionContext }>();
