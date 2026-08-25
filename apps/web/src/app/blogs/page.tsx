import type { Metadata } from "next";
import Link from "next/link";
import { PageTransition } from "@/components/layout/page-transition";
import { BlogItem } from "@/components/portfolio/blog-item";
import { PageHeader } from "@/components/portfolio/page-header";
import { createPageMetadata } from "@/lib/metadata";
import { getBlogPostsPage } from "@/lib/sanity/services/blog";

const POSTS_PER_PAGE = 10;

type BlogsPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

function getRequestedPage(value: string | string[] | undefined) {
  const rawPage = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(rawPage ?? "1", 10);

  if (!Number.isSafeInteger(page) || page < 1) return 1;
  return page;
}

function pageHref(page: number) {
  return `/blogs?page=${page}`;
}

export const metadata: Metadata = createPageMetadata({
  title: "Blog",
  description:
    "Writing about software engineering, web development, architecture, tooling, and AI.",
  path: "/blogs",
});

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  const { page } = await searchParams;
  const requestedPage = getRequestedPage(page);
  const requestedStart = (requestedPage - 1) * POSTS_PER_PAGE;
  let pageData = await getBlogPostsPage(requestedStart, requestedStart + POSTS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(pageData.total / POSTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);

  if (currentPage !== requestedPage) {
    const currentStart = (currentPage - 1) * POSTS_PER_PAGE;
    pageData = await getBlogPostsPage(currentStart, currentStart + POSTS_PER_PAGE);
  }

  return (
    <PageTransition>
      <PageHeader
        index="03"
        eyebrow="Blog"
        title="Writing about software engineering, web development, architecture, tooling, and AI."
      />
      <div className="mt-10 divide-y divide-border border-t border-border">
        {pageData.total === 0 && (
          <p className="py-10 text-sm text-muted">No blog posts are published yet.</p>
        )}
        {pageData.posts.length > 0 && (
          <ul className="divide-y divide-border">
            {pageData.posts.map((post) => (
              <li key={post.slug}>
                <BlogItem post={post} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {pageData.total > POSTS_PER_PAGE && (
        <nav
          aria-label="Blog pagination"
          className="mt-8 flex items-center justify-between gap-4 text-sm"
        >
          {currentPage > 1 ? (
            <Link
              href={pageHref(currentPage - 1)}
              className="inline-flex min-h-6 items-center underline-offset-4 transition-colors duration-200 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground motion-reduce:transition-none"
            >
              ← Newer posts
            </Link>
          ) : (
            <span aria-disabled="true" className="text-muted">
              ← Newer posts
            </span>
          )}
          <p className="font-mono text-xs text-muted">
            Page {currentPage} of {totalPages}
          </p>
          {currentPage < totalPages ? (
            <Link
              href={pageHref(currentPage + 1)}
              className="inline-flex min-h-6 items-center underline-offset-4 transition-colors duration-200 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground motion-reduce:transition-none"
            >
              Older posts →
            </Link>
          ) : (
            <span aria-disabled="true" className="text-muted">
              Older posts →
            </span>
          )}
        </nav>
      )}
    </PageTransition>
  );
}
