// @ts-nocheck
import Document, { Html, Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';
import { seo } from '../src/config';

class MyDocument extends Document {
  static async getInitialProps(ctx: any) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App: any) => (props: any) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    return (
      <Html lang='en'>
        <Head>
          <meta charset='UTF-8' />
          <meta name='description' content={seo.description} />

          <meta property='og:title' content={seo.title} />
          <meta property='og:description' content={seo.description} />
          <meta property='og:image' content={seo.image} />
          <meta property='og:url' content={seo.url} />

          <meta name='twitter:title' content={seo.title} />
          <meta name='twitter:description' content={seo.description} />
          <meta name='twitter:image' content={seo.image} />
          <meta name='twitter:card' content='summary_large_image' />
          <meta name='twitter:creator' content={seo.title} />
          <meta
            name='google-site-verification'
            content='jvWN1uM-h3tiEcihL_UdVN3MvownDLRfLFOJP3pF40s'
          />
          <link rel='preconnect' href='https://fonts.googleapis.com' />
          <link rel='preconnect' href='https://fonts.gstatic.com' />
          <link
            href='https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700&display=swap'
            rel='stylesheet'
          />
          <link rel='shortcut icon' href='/favicon.ico' />
          <link
            rel='apple-touch-icon'
            sizes='180x180'
            href='/apple-touch-icon.png'
          />
          <link
            rel='icon'
            type='image/png'
            sizes='32x32'
            href='/favicon-32x32.png'
          />
          <link
            rel='icon'
            type='image/png'
            sizes='16x16'
            href='/favicon-16x16.png'
          />
          <link rel='manifest' href='/site.webmanifest' />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
