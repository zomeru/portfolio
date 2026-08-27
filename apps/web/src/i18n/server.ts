import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { isLocale, type Locale } from "./routing";

export type LocaleParams = Promise<{ locale: string }>;

export async function resolveLocale(params: LocaleParams): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  return locale;
}
