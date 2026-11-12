import { createFileRoute } from "@tanstack/react-router";
import { useTranslations } from "use-intl";

import { BlogNotifications } from "@/components/blog/blog-notifications";
import { PageTransition } from "@/components/layout/page-transition";
import { BlogItem } from "@/components/portfolio/blog-item";
import { PageHeader } from "@/components/portfolio/page-header";
import { Link } from "@/i18n/navigation";
import { translatedHead } from "@/lib/localized-head";
import { getBlogList, POSTS_PER_PAGE } from "@/lib/public.functions";

function pageHref(page: number) {
  return `/blogs?page=${page}`;
}

export const Route = createFileRoute("/{-$locale}/blogs/")({
  validateSearch: ({ page, subscription }: Record<string, unknown>) => {
    const parsed = Number.parseInt(String(Array.isArray(page) ? page[0] : page), 10);
    return {
      page:
        Number.isSafeInteger(parsed) &&
        parsed >= 1 &&
        parsed <= Math.floor(Number.MAX_SAFE_INTEGER / POSTS_PER_PAGE)
          ? parsed
          : undefined,
      subscription:
        subscription === "confirmed" || subscription === "invalid" ? subscription : undefined,
    };
  },
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ deps }) => getBlogList({ data: deps.page }),
  head: (input) =>
    translatedHead(input, "blogs", "/blogs", { imagePath: "/blogs/opengraph-image" }),
  component: BlogsPage,
});

function BlogsPage() {
  const t = useTranslations("Blogs");
  const { subscription } = Route.useSearch();
  const { pageData, currentPage, totalPages } = Route.useLoaderData();
  return (
    <PageTransition>
      <PageHeader index="03" eyebrow={t("eyebrow")} title={t("title")} />
      <BlogNotifications
        {...(subscription === "confirmed" || subscription === "invalid"
          ? { initialNotice: subscription }
          : {})}
      />
      <div className="mt-10 divide-y divide-border border-t border-border">
        {pageData.total === 0 && <p className="py-10 text-sm text-muted">{t("empty")}</p>}
        {pageData.items.length > 0 && (
          <ul className="divide-y divide-border">
            {pageData.items.map((post) => (
              <li key={post.slug}>
                <BlogItem post={post} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {pageData.total > POSTS_PER_PAGE && (
        <nav
          aria-label={t("pagination.label")}
          className="mt-8 flex items-center justify-between gap-4 text-sm"
        >
          {currentPage > 1 ? (
            <Link
              href={pageHref(currentPage - 1)}
              className="inline-flex min-h-6 items-center underline-offset-4 transition-colors duration-200 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground motion-reduce:transition-none"
            >
              ← {t("pagination.newer")}
            </Link>
          ) : (
            <span aria-disabled="true" className="text-muted">
              ← {t("pagination.newer")}
            </span>
          )}
          <p className="font-mono text-xs text-muted">
            {t("pagination.page", { page: currentPage, total: totalPages })}
          </p>
          {currentPage < totalPages ? (
            <Link
              href={pageHref(currentPage + 1)}
              className="inline-flex min-h-6 items-center underline-offset-4 transition-colors duration-200 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground motion-reduce:transition-none"
            >
              {t("pagination.older")} →
            </Link>
          ) : (
            <span aria-disabled="true" className="text-muted">
              {t("pagination.older")} →
            </span>
          )}
        </nav>
      )}
    </PageTransition>
  );
}
