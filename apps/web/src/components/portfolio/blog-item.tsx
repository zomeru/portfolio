import type { PublicBlogPostSummary } from "@portfolio/api/public-portfolio";
import { ArrowUpRight } from "lucide-react";
import { getLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export async function BlogItem({ post }: { post: PublicBlogPostSummary }) {
  const locale = await getLocale();
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(post.date));

  return (
    <Link
      href={`/blogs/${post.slug}`}
      className="group grid gap-3 rounded-md py-5 outline-offset-2 focus-visible:outline-2 focus-visible:outline-foreground sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"
    >
      <time dateTime={post.date} className="font-mono text-xs text-muted sm:pt-0.5">
        {date}
      </time>
      <article>
        <h2 className="flex items-baseline justify-between gap-4 font-medium tracking-tight">
          <span className="transition-colors duration-200 group-hover:text-muted motion-reduce:transition-none">
            {post.title}
          </span>
          <ArrowUpRight aria-hidden="true" className="shrink-0" size={15} strokeWidth={1.5} />
        </h2>
        <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted">{post.description}</p>
        {post.tags && post.tags.length > 0 && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted">
            {post.tags.join(" · ")}
          </p>
        )}
      </article>
    </Link>
  );
}
