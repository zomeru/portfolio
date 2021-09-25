import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import TagManager from 'react-gtm-module';
import { GlobalStyles } from '../src/styles/GlobalStyles';
import { ThemeModeProvider } from '../src/contexts/ThemeModeContext';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  useEffect(() => {
    TagManager.initialize({ gtmId: 'G-XNJS2S5JPX' });
  }, []);

  const isHome = router.pathname === '/';

  return (
    <ThemeModeProvider>
      <GlobalStyles />
      <Component {...pageProps} isHome={isHome} />
    </ThemeModeProvider>
  );
}

export default MyApp;
