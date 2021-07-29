import React from 'react';
import { Helmet } from 'react-helmet';

const Head = () => {
  return (
    <>
      <Helmet>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' />
        <link
          href='https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700&display=swap'
          rel='stylesheet'
        />
        {/* <meta name='description' content={seo.description} />
        <meta name='image' content={seo.image} />

        <meta property='og:title' content={seo.title} />
        <meta property='og:description' content={seo.description} />
        <meta property='og:image' content={seo.image} />
        <meta property='og:url' content={seo.url} />
        <meta property='og:type' content='website' />

        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:creator' content={twitterUsername} />
        <meta name='twitter:title' content={seo.title} />
        <meta name='twitter:description' content={seo.description} />
        <meta name='twitter:image' content={seo.image} /> */}
      </Helmet>
    </>
  );
};

export default Head;
