import { cache } from "react";

import { sanityFetch } from "../fetch";
import { BLOG_POST_QUERY, BLOG_POST_SLUGS_QUERY, BLOG_POSTS_QUERY } from "../queries";

export const getBlogPosts = cache(() =>
  sanityFetch({ query: BLOG_POSTS_QUERY, tags: ["blogPost"] }),
);

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
