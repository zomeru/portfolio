import { createFileRoute } from "@tanstack/react-router";
import { useTranslations } from "use-intl";

import { BlogNotifications } from "@/components/blog/blog-notifications";
import { PageTransition } from "@/components/layout/page-transition";
import { MarkdownContent } from "@/components/portfolio/markdown-content";
import { Link } from "@/i18n/navigation";
import { localizedHead } from "@/lib/localized-head";
import { getBlog } from "@/lib/public.functions";

export const Route = createFileRoute("/{-$locale}/blogs/$slug")({
  loader: ({ params }) => getBlog({ data: params.slug }),
  head: (input) => {
    const post = input.loaderData;
    if (!post) return {};
    return localizedHead(input, {
      title: post.title,
      description: post.description,
      path: `/blogs/${post.slug}`,
      imagePath: `/blogs/${post.slug}/opengraph-image`,
      article: { date: post.date, tags: post.tags ?? [] },
    });
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { locale } = Route.useRouteContext();
  const t = useTranslations("Blogs");
  const post = Route.useLoaderData();
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
          <MarkdownContent html={post.html} />
        </div>
      </article>
    </PageTransition>
  );
}
