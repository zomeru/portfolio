import { getSearchIndex } from "@/features/search/lib/get-index";
import { isLocale, routing } from "@/i18n/routing";

export const revalidate = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function GET(_: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return Response.json({ error: "Unsupported locale." }, { status: 404 });

  return Response.json(await getSearchIndex(locale));
}
