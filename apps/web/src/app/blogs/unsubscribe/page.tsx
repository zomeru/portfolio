import type { Metadata } from "next";

import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/portfolio/page-header";

import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata: Metadata = {
  title: "Unsubscribe from blog emails",
  description: "Manage your Zomer Gregorio blog email subscription.",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <PageTransition>
      <PageHeader index="03" eyebrow="Blog" title="Unsubscribe from blog emails." />
      <UnsubscribeForm {...(token ? { token } : {})} />
    </PageTransition>
  );
}
