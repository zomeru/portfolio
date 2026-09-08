export type AssistantMode = "offline" | "online" | "unavailable";

export function selectAssistantMode(
  isOffline: boolean,
  offlineModelInstalled: boolean,
): AssistantMode {
  if (!isOffline) return "online";
  return offlineModelInstalled ? "offline" : "unavailable";
}
