import { createTranslator } from "use-intl/core";

import type { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";

import { getSiteMatch, pageHead } from "./route-head";

type HeadContext = {
  match: { context: { locale: Locale; messages: Awaited<ReturnType<typeof getMessages>> } };
  matches: Parameters<typeof getSiteMatch>[0];
};

type HeadOptions = Omit<Parameters<typeof pageHead>[0], "locale" | "siteUrl" | "siteName">;

export function localizedHead({ match: { context }, matches }: HeadContext, options: HeadOptions) {
  const site = getSiteMatch(matches);
  if (!site) return {};
  const siteName = site.profile?.name || "Zomer Gregorio";
  return pageHead({
    ...options,
    title: `${options.title} - ${siteName}`,
    locale: context.locale,
    siteUrl: site.siteUrl,
    siteName,
  });
}

export function translatedHead(
  input: HeadContext,
  namespace:
    | "assistant"
    | "blogs"
    | "contact"
    | "developers"
    | "github"
    | "projects"
    | "unsubscribe",
  path: string,
  options: Pick<HeadOptions, "imagePath" | "noindex"> = {},
) {
  const t = createTranslator({ ...input.match.context, namespace: `Metadata.${namespace}` });
  return localizedHead(input, {
    title: t("title"),
    description: t("description"),
    path,
    ...options,
  });
}
