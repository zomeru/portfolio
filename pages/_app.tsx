import type { AppProps } from 'next/app';
import App from 'next/app';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import * as gtag from '../lib/gtag';
import { ThemeProvider } from 'styled-components';
import { useDarkMode } from '../src/hooks/useDarkMode';
import { lightTheme, darkTheme } from '../src/styles/theme';
import { GlobalStyles } from '../src/styles/GlobalStyles';

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

  const isHome = router.pathname === '/';

  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [theme, toggleTheme] = useDarkMode();
  const themeMode = theme === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeProvider theme={themeMode}>
      <GlobalStyles />
      {/* {isMounted && (
        <Component
          {...pageProps}
          toggleTheme={toggleTheme}
          theme={theme}
          isHome={isHome}
        />
      )} */}

      <Component
        {...pageProps}
        toggleTheme={toggleTheme}
        theme={theme}
        isHome={isHome}
      />
    </ThemeProvider>
  );
}

export default MyApp;
