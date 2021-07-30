import type { AppProps } from 'next/app';
import { GlobalStyles } from '../src/styles';
import Head from 'next/head';

//TODO REFACTOR THE HEAD LATER
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* REFACTOR THIS */}
      <Head>
        <title>Zomer Gregorio</title>
        <meta name='viewport' content='initial-scale=1.0, width=device-width' />
        <meta
          name='description'
          content='Zomer Gregorio is college student and an aspiring Fullstack developer based in the Philippines.'
        />

        <meta property='og:title' content='Zomer Gregorio' />
        <meta
          property='og:description'
          content='Zomer Gregorio is college student and an aspiring Fullstack developer based in the Philippines.'
        />
        <meta
          property='og:image'
          content='https://raw.githubusercontent.com/zomeru/portfolio/main/src/assets/images/screenshot.png'
        />
        <meta property='og:url' content='https://zomergregorio.live/' />

        <meta name='twitter:title' content='Zomer Gregorio' />
        <meta
          name='twitter:description'
          content='Zomer Gregorio is college student and an aspiring Fullstack developer based in the Philippines.'
        />
        <meta
          name='twitter:image'
          content='https://raw.githubusercontent.com/zomeru/portfolio/main/src/assets/images/screenshot.png'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:creator' content='Zomer Gregorio' />
      </Head>

      <Component {...pageProps} />
    </>
  );
}
export default MyApp;
