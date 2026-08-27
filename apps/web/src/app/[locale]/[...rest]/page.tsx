import { notFound } from "next/navigation";

import { resolveLocale, type LocaleParams } from "@/i18n/server";

export default async function LocalizedCatchAll({ params }: { params: LocaleParams }) {
  await resolveLocale(params);
  notFound();
}
