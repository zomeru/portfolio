import type { Metadata } from "next";

import { BlogItem } from "@/components/portfolio/blog-item";
import { PageHeader } from "@/components/portfolio/page-header";
import { posts } from "@/data/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing about software engineering, web development, architecture, tooling, and AI.",
};

export default function BlogsPage() {
  const years = [...new Set(posts.map((post) => post.date.slice(0, 4)))];

  return (
    <>
      <PageHeader
        index="03"
        eyebrow="Blog"
        title="Writing about software engineering, web development, architecture, tooling, and AI."
      />
      <div className="mt-10 divide-y divide-border border-t border-border">
        {years.map((year) => (
          <section key={year} aria-labelledby={`year-${year}`} className="py-6 sm:py-8">
            <h2
              id={`year-${year}`}
              className="font-mono text-xs uppercase tracking-widest text-muted"
            >
              {year}
            </h2>
            <ul className="mt-2 divide-y divide-border">
              {posts
                .filter((post) => post.date.startsWith(year))
                .map((post) => (
                  <li key={post.slug}>
                    <BlogItem post={post} />
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
