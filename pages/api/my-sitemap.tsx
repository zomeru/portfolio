import { GetServerSideProps } from 'next';
import { getServerSideSitemap, ISitemapField } from 'next-sitemap';

export const getServerSideProps: GetServerSideProps = async ctx => {
  const fields: ISitemapField[] = [
    {
      loc: `https://zomer.xyz`,
      lastmod: new Date().toISOString(),
    },
    {
      loc: `https://zomer.xyz/blog`,
      lastmod: new Date().toISOString(),
    },
  ];

  return getServerSideSitemap(ctx, fields);
};

export default function Site() {}
