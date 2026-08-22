import { cache } from "react";

import { sanityFetch } from "../fetch";
import {
  BLOG_POST_QUERY,
  BLOG_POST_SLUGS_QUERY,
  BLOG_POSTS_QUERY,
  createBlogPostsPageQuery,
} from "../queries";
import type { BlogPostListItem } from "../types";

type BlogPostsPage = {
  posts: BlogPostListItem[];
  total: number;
};

export const getBlogPosts = cache(() =>
  sanityFetch({ query: BLOG_POSTS_QUERY, tags: ["blogPost"] }),
);

export const getBlogPostsPage = cache(async (start: number, end: number) => {
  const result = await sanityFetch({
    query: createBlogPostsPageQuery(start, end),
    tags: ["blogPost"],
  });

  return result as BlogPostsPage;
});

export const getBlogPostBySlug = cache((slug: string) =>
  sanityFetch({
    query: BLOG_POST_QUERY,
    params: { slug },
    tags: ["blogPost", `blogPost:${slug}`],
  }),
);

export const getBlogPostSlugs = cache(() =>
  sanityFetch({
    query: BLOG_POST_SLUGS_QUERY,
    revalidate: 3600,
    tags: ["blogPost"],
    useCdn: false,
  }),
);
