import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { BookACallButton } from "@/components/portfolio/book-a-call-button";
import { PageHeader } from "@/components/portfolio/page-header";
import { createPageMetadata } from "@/lib/metadata";
import { getProfileSocials } from "@/lib/sanity/profile";
import { getProfile } from "@/lib/sanity/services/profile";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description: "Have a project, opportunity, or interesting idea? Let's talk.",
  path: "/contact",
});

export default async function ContactPage() {
  const profile = await getProfile();
  const elsewhere = (profile ? getProfileSocials(profile) : []).filter((p) => p.name !== "GitHub");

  return (
    <>
      <PageHeader
        index="05"
        eyebrow="Let's talk"
        title="Have a project, opportunity, or interesting idea?"
      />

      <BookACallButton />

      <h2 className="mt-16 font-mono text-xs uppercase tracking-widest text-muted">Elsewhere</h2>
      <ul className="mt-2 divide-y divide-border border-t border-border">
        {elsewhere.map((social) => (
          <li key={social.name}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 py-4 text-sm underline-offset-4 transition-colors duration-200 hover:text-muted motion-reduce:transition-none"
            >
              {social.name} <ArrowUpRight aria-hidden="true" size={14} />
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
