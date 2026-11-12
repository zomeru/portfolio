import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "use-intl";

import { PageTransition } from "@/components/layout/page-transition";
import { BookACallButton } from "@/components/portfolio/book-a-call-button";
import { PageHeader } from "@/components/portfolio/page-header";
import { translatedHead } from "@/lib/localized-head";
import { getProfileSocials } from "@/lib/sanity/profile";

import { Route as Root } from "../__root";

export const Route = createFileRoute("/{-$locale}/contact")({
  head: (input) =>
    translatedHead(input, "contact", "/contact", { imagePath: "/contact/opengraph-image" }),
  component: ContactPage,
});

function ContactPage() {
  const { profile } = Root.useLoaderData();
  const t = useTranslations("Contact");
  const tCommon = useTranslations("Common");
  const elsewhere = (profile ? getProfileSocials(profile) : []).filter((p) => p.name !== "GitHub");
  return (
    <PageTransition>
      <PageHeader index="06" eyebrow={t("eyebrow")} title={t("title")} />

      <BookACallButton />

      <h2 className="mt-16 font-mono text-xs uppercase tracking-widest text-muted">
        {t("elsewhere")}
      </h2>
      <ul className="mt-2 divide-y divide-border border-t border-border">
        {elsewhere.map((social) => (
          <li key={social.name}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 py-4 text-sm underline-offset-4 transition-colors duration-200 hover:text-muted motion-reduce:transition-none"
            >
              {social.name === "Email" ? tCommon("social.email") : social.name}{" "}
              <ArrowUpRight aria-hidden="true" size={14} />
            </a>
          </li>
        ))}
      </ul>
    </PageTransition>
  );
}
