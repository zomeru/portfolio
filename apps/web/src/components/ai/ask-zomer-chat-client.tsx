"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { z } from "zod";

z.config({ jitless: true });

function AskZomerLoading() {
  const t = useTranslations("Assistant");
  return (
    <div className="mt-10 border-y border-border py-12" aria-busy="true">
      <p className="text-sm text-muted">{t("preparingConversation")}</p>
    </div>
  );
}

const AskZomerChatContent = dynamic(
  () => import("./ask-zomer-chat").then((module) => module.AskZomerChatContent),
  {
    ssr: false,
    loading: AskZomerLoading,
  },
);

export function AskZomerChat({ initialQuestion }: { initialQuestion: string | undefined }) {
  return <AskZomerChatContent initialQuestion={initialQuestion} />;
}
