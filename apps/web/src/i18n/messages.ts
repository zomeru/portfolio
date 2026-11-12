import type { Locale } from "./routing";

export type Messages = typeof import("../../messages/en");

// Each locale is one lazy chunk, so client navigation never needs a request per namespace.
const messageLoaders = {
  en: () => import("../../messages/en"),
  ja: () => import("../../messages/ja"),
  "zh-CN": () => import("../../messages/zh-CN"),
  de: () => import("../../messages/de"),
} satisfies Record<Locale, () => Promise<Messages>>;

export async function getMessages(locale: Locale): Promise<Messages> {
  // Keep router hydration data a plain object rather than a module namespace.
  return { ...(await messageLoaders[locale]()) };
}
