import { GetServerSideProps } from 'next';
import { getServerSideSitemap, ISitemapField } from 'next-sitemap';

export const getServerSideProps: GetServerSideProps = async ctx => {
  const query = encodeURIComponent('*[ _type == "post" ]');
  const url = `https://${process.env.SANITY_PROJECT_ID}.api.sanity.io/v1/data/query/production?query=${query}`;
  const result = await fetch(url).then(res => res.json());

  const fields: ISitemapField[] = result.result.map(post => ({
    loc: `https://zomer.xyz/blog/${post.slug.current}`,
    lastmod: post._updatedAt,
  }));

  return getServerSideSitemap(ctx, fields);
};

export default function Site() {}
