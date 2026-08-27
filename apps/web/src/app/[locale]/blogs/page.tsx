import { listPublicBlogPosts } from "@portfolio/api/public-portfolio";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { BlogNotifications } from "@/components/blog/blog-notifications";
import { PageTransition } from "@/components/layout/page-transition";
import { BlogItem } from "@/components/portfolio/blog-item";
import { PageHeader } from "@/components/portfolio/page-header";
import { Link } from "@/i18n/navigation";
import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { createPageMetadata } from "@/lib/metadata";

const POSTS_PER_PAGE = 10;

type BlogsPageProps = {
  params: LocaleParams;
  searchParams: Promise<{
    page?: string | string[];
    subscription?: string | string[];
  }>;
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

export async function generateMetadata({ params }: BlogsPageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Metadata.blogs" });
  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/blogs",
  });
}

export default async function BlogsPage({ params, searchParams }: BlogsPageProps) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Blogs" });
  const { page, subscription: subscriptionValue } = await searchParams;
  const subscription = Array.isArray(subscriptionValue) ? subscriptionValue[0] : subscriptionValue;
  const requestedPage = getRequestedPage(page);
  const requestedStart = (requestedPage - 1) * POSTS_PER_PAGE;
  let pageData = await listPublicBlogPosts({ limit: POSTS_PER_PAGE, offset: requestedStart });
  const totalPages = Math.max(1, Math.ceil(pageData.total / POSTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);

  if (currentPage !== requestedPage) {
    const currentStart = (currentPage - 1) * POSTS_PER_PAGE;
    pageData = await listPublicBlogPosts({ limit: POSTS_PER_PAGE, offset: currentStart });
  }

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
