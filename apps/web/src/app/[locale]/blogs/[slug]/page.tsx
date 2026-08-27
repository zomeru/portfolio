import { getPublicBlogPost, getPublicPortfolioSnapshot } from "@portfolio/api/public-portfolio";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { BlogNotifications } from "@/components/blog/blog-notifications";
import { PageTransition } from "@/components/layout/page-transition";
import { MarkdownContent } from "@/components/portfolio/markdown-content";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/server";
import { createPageMetadata } from "@/lib/metadata";

type BlogPostPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  return (await getPublicPortfolioSnapshot()).blogs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const post = await getPublicBlogPost(slug);
  if (!post) return {};

  const metadata = createPageMetadata({
    title: post.title,
    description: post.description,
    locale,
    path: `/blogs/${post.slug}`,
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      publishedTime: post.date,
      tags: post.tags ?? undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const locale = await resolveLocale(params);
  const [{ slug }, t] = await Promise.all([
    params,
    getTranslations({ locale, namespace: "Blogs" }),
  ]);
  const post = await getPublicBlogPost(slug);
  if (!post) notFound();

  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(post.date));

  return (
    <PageTransition>
      <article>
        <Link
          href="/blogs"
          className="font-mono text-xs text-muted underline-offset-4 transition-colors duration-200 hover:text-foreground motion-reduce:transition-none"
        >
          ← {t("back")}
        </Link>
        <h1 className="mt-6 text-balance text-2xl font-medium leading-snug tracking-tight sm:text-3xl">
          {post.title}
        </h1>
        <p className="mt-3 font-mono text-xs text-muted">
          <time dateTime={post.date}>{date}</time>
          {post.tags && post.tags.length > 0 ? ` · ${post.tags.join(" · ")}` : ""}
        </p>
        <p className="mt-8 text-sm leading-relaxed text-muted">{post.description}</p>
        <BlogNotifications />
        <div className="mt-8">
          <MarkdownContent value={post.body} />
        </div>
      </article>
    </PageTransition>
  );
}
