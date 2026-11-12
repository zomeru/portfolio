import "@tanstack/react-start/server-only";
import { createTranslator, type NamespaceKeys, type NestedKeyOf } from "use-intl/core";

import { getMessages } from "./messages";
import type { Locale } from "./routing";

type Messages = Awaited<ReturnType<typeof getMessages>>;

export async function getTranslations<N extends NamespaceKeys<Messages, NestedKeyOf<Messages>>>({
  locale,
  namespace,
}: {
  locale: Locale;
  namespace: N;
}) {
  return createTranslator({ locale, messages: await getMessages(locale), namespace });
}
