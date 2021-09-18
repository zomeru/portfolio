/* eslint-disable @next/next/no-page-custom-font */
import React from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { CustomSeoProps } from '../configs/types';
import { GA_TRACKING_ID } from '../../lib/gtag';

interface PageHeadProps {
  seo?: CustomSeoProps;
}

const PageHead: React.FC<PageHeadProps> = ({ seo }) => {
  return (
    <Head>
      <meta charSet='UTF-8' />
      <meta name='viewport' content='initial-scale=1.0, width=device-width' />
      <meta name='description' content={seo.description} />
      <meta name='image' content={seo.image} />

      <meta property='og:title' content={seo.title} />
      <meta property='og:description' content={seo.description} />
      <meta property='og:image' content={seo.image} />
      <meta property='og:url' content={seo.url} />
      <meta property='og:type' content='website' />

      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:creator' content={seo.twitterUsername} />
      <meta name='twitter:title' content={seo.title} />
      <meta name='twitter:description' content={seo.description} />
      <meta name='twitter:image' content={seo.image} />
      <meta charSet='UTF-8' />
      <link
        rel='apple-touch-icon'
        sizes='57x57'
        href='/icons/apple-icon-57x57.png'
      />
      <link
        rel='apple-touch-icon'
        sizes='60x60'
        href='/icons/apple-icon-60x60.png'
      />
      <link
        rel='apple-touch-icon'
        sizes='72x72'
        href='/icons/apple-icon-72x72.png'
      />
      <link
        rel='apple-touch-icon'
        sizes='76x76'
        href='/icons/apple-icon-76x76.png'
      />
      <link
        rel='apple-touch-icon'
        sizes='114x114'
        href='/icons/apple-icon-114x114.png'
      />
      <link
        rel='apple-touch-icon'
        sizes='120x120'
        href='/icons/apple-icon-120x120.png'
      />
      <link
        rel='apple-touch-icon'
        sizes='144x144'
        href='/icons/apple-icon-144x144.png'
      />
      <link
        rel='apple-touch-icon'
        sizes='152x152'
        href='/icons/apple-icon-152x152.png'
      />
      <link
        rel='apple-touch-icon'
        sizes='180x180'
        href='/icons/apple-icon-180x180.png'
      />
      <link
        rel='icon'
        type='image/png'
        sizes='192x192'
        href='/icons/android-icon-192x192.png'
      />
      <link
        rel='icon'
        type='image/png'
        sizes='32x32'
        href='/icons/favicon-32x32.png'
      />
      <link
        rel='icon'
        type='image/png'
        sizes='96x96'
        href='/icons/favicon-96x96.png'
      />
      <link
        rel='icon'
        type='image/png'
        sizes='16x16'
        href='/icons/favicon-16x16.png'
      />
      <link rel='manifest' href='/site.webmanifest' />
      <meta name='msapplication-TileColor' content='#0d1a25' />
      <meta
        name='msapplication-TileImage'
        content='/icons/ms-icon-144x144.png'
      />
      <meta name='theme-color' content='#0d1a25' />
      <link rel='mask-icon' href='/icons/mask-icon.svg' color='#0d1a25' />
      <link rel='preconnect' href='https://fonts.googleapis.com' />
      <link
        rel='preconnect'
        href='https://fonts.gstatic.com'
        crossOrigin='anonymous'
      />
      <link
        href='https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap'
        rel='preload'
        as='style'
      />
      <link
        href='https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap'
        rel='stylesheet'
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      <title>{seo.title}</title>
    </Head>
  );
};

export default PageHead;
