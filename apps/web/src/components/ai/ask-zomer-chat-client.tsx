"use client";

import dynamic from "next/dynamic";

const AskZomerChatContent = dynamic(
  () => import("./ask-zomer-chat").then((module) => module.AskZomerChatContent),
  {
    ssr: false,
    loading: () => (
      <div className="mt-10 border-y border-border py-12" aria-busy="true">
        <p className="text-sm text-muted">Preparing your conversation…</p>
      </div>
    ),
  },
);

export function AskZomerChat() {
  return <AskZomerChatContent />;
}
