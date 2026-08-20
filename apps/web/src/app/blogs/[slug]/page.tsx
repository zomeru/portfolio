import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownContent } from "@/components/portfolio/markdown-content";
import { getBlogPostBySlug, getBlogPostSlugs } from "@/lib/sanity/services/blog";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return await getBlogPostSlugs();
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  return { title: post.title, description: post.description };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const date = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(post.date));

  return (
    <article>
      <Link
        href="/blogs"
        className="font-mono text-xs text-muted underline-offset-4 transition-colors duration-200 hover:text-foreground motion-reduce:transition-none"
      >
        ← Blog
      </Link>
      <h1 className="mt-6 text-2xl font-medium leading-snug tracking-tight sm:text-3xl">
        {post.title}
      </h1>
      <p className="mt-3 font-mono text-xs text-muted">
        <time dateTime={post.date}>{date}</time>
        {post.tags && post.tags.length > 0 ? ` · ${post.tags.join(" · ")}` : ""}
      </p>
      <p className="mt-8 text-sm leading-relaxed text-muted">{post.description}</p>
      <div className="mt-8">
        <MarkdownContent value={post.body} />
      </div>
    </article>
  );
}
