import Link from "next/link";

import type { BlogPost } from "@/data/blog";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function BlogItem({ post }: { post: BlogPost }) {
  const date = dateFormatter.format(new Date(`${post.date}T00:00:00Z`));

  return (
    <article className="grid gap-3 py-6 sm:grid-cols-[8rem_1fr] sm:gap-8">
      <time dateTime={post.date} className="font-mono text-xs text-muted sm:pt-0.5">
        {date}
      </time>
      <div>
        <h3 className="font-medium">
          <Link
            href={`/blogs/${post.slug}`}
            className="underline-offset-4 transition-colors duration-200 hover:text-muted motion-reduce:transition-none"
          >
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">{post.description}</p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted">
          {post.tags.join(" · ")}
        </p>
      </div>
    </article>
  );
}
