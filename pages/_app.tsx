import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import * as gtag from '../lib/gtag';
import {
  GlobalStyles,
  lightTheme,
  darkTheme,
} from '../src/styles/otherStyles/GlobalStyles';
import { ThemeProvider } from 'styled-components';
import { useDarkMode } from '../src/hooks/useDarkMode';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  useEffect(() => {
    const handleRouteChange = (url: any) => {
      gtag.pageview(url);
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [theme, toggleTheme] = useDarkMode();
  const themeMode = theme === 'light' ? lightTheme : darkTheme;

  return (
    <>
      <Head>
        <meta name='viewport' content='initial-scale=1.0, width=device-width' />
        <title>Zomer Gregorio | Zomeru</title>
      </Head>
      <ThemeProvider theme={themeMode}>
        <GlobalStyles />
        {isMounted && <Component {...pageProps} toggleTheme={toggleTheme} />}
      </ThemeProvider>
    </>
  );
}
export default MyApp;
