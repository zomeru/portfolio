import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/portfolio/page-header";
import { profile } from "@/data/profile";
import { socials } from "@/data/socials";

export const metadata: Metadata = {
  title: "Contact",
  description: "Have a project, opportunity, or interesting idea? Let's talk.",
};

const elsewhere = socials.filter((social) => social.name !== "Email");

export default function ContactPage() {
  return (
    <>
      <PageHeader
        index="04"
        eyebrow="Let's talk"
        title="Have a project, opportunity, or interesting idea?"
      />
      <p className="mt-4 text-sm leading-relaxed text-muted">Let's talk.</p>

      <a
        href={`mailto:${profile.email}`}
        className="mt-8 inline-flex items-center gap-1 text-lg font-medium underline-offset-4 transition-colors duration-200 hover:text-muted motion-reduce:transition-none"
      >
        {profile.email} <ArrowUpRight size={16} />
      </a>

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
              {social.name} <ArrowUpRight size={14} />
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
