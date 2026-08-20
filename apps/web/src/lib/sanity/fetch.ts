import type { QueryParams } from "next-sanity";

import { sanityClient } from "./client";

const DEFAULT_REVALIDATE_SECONDS = 300;

type SanityFetchOptions<QueryString extends string> = {
  query: QueryString;
  params?: QueryParams;
  tags?: string[];
  revalidate?: number | false;
  useCdn?: boolean;
};

export function sanityFetch<const QueryString extends string>({
  query,
  params = {},
  tags = [],
  revalidate = DEFAULT_REVALIDATE_SECONDS,
  useCdn,
}: SanityFetchOptions<QueryString>) {
  const client = useCdn === undefined ? sanityClient : sanityClient.withConfig({ useCdn });

  return client.fetch(query, params, {
    next: {
      revalidate,
      tags,
    },
  });
}
