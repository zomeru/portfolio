import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { posts } from "@/data/blog";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((entry) => entry.slug === slug);
  if (!post) return {};
  return { title: post.title };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = posts.find((entry) => entry.slug === slug);
  if (!post) notFound();

  const date = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${post.date}T00:00:00Z`));

  return (
    <article>
      <Link
        href="/blogs"
        className="font-mono text-xs text-muted underline-offset-4 transition-colors duration-200 hover:text-foreground motion-reduce:transition-none"
      >
        ← Blog
      </Link>
      <h1 className="mt-6 max-w-2xl text-2xl font-medium leading-snug tracking-tight sm:text-3xl">
        {post.title}
      </h1>
      <p className="mt-3 font-mono text-xs text-muted">
        <time dateTime={post.date}>{date}</time> · {post.tags.join(" · ")}
      </p>
      <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted">{post.description}</p>
    </article>
  );
}
