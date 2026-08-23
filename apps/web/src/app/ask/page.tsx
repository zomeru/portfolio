import type { Metadata } from "next";
import { AskZomerChat } from "@/components/ai/ask-zomer-chat";
import { PageHeader } from "@/components/portfolio/page-header";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Ask Zomer AI",
  description: "Ask an AI assistant about Zomer's work, experience, projects, and writing.",
  path: "/ask",
});

export default function AskPage() {
  return (
    <>
      <PageHeader
        index="04"
        eyebrow="Ask Zomer AI"
        title="A grounded guide to my experience, projects, and writing."
      />
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Ask about anything on this portfolio. Answers about me cite the pages they came from.
      </p>
      <AskZomerChat />
    </>
  );
}
