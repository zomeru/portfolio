import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { useTranslations } from "use-intl";
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

const AskZomerChatContent = lazy(() =>
  import("./ask-zomer-chat").then(({ AskZomerChatContent }) => ({ default: AskZomerChatContent })),
);

export function AskZomerChat({ initialQuestion }: { initialQuestion: string | undefined }) {
  return (
    <ClientOnly fallback={<AskZomerLoading />}>
      <Suspense fallback={<AskZomerLoading />}>
        <AskZomerChatContent initialQuestion={initialQuestion} />
      </Suspense>
    </ClientOnly>
  );
}
