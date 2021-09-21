import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import * as gtag from '../lib/gtag';
import { GlobalStyles } from '../src/styles/GlobalStyles';
import { ThemeModeProvider } from '../src/contexts/ThemeModeContext';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // const [prevScrollPos, setPrevScrollPos] = useState<number>();
  // const [curScrollPos, setCurScrollPos] = useState<number>();

  // useEffect(() => {
  //   setCurScrollPos(window.pageYOffset);
  //   console.log('Prev', prevScrollPos);
  //   window.onscroll = function () {
  //     const e = window.pageYOffset;
  //     setCurScrollPos(e);
  //     setPrevScrollPos(curScrollPos);
  //   };
  //   console.log('Cur', curScrollPos);
  // }, [curScrollPos]);

  console.log('RE-RENDER ALL');

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

  return (
    <ThemeModeProvider>
      <GlobalStyles />
      <Component
        onScroll={() => console.log('ONSCROLL')}
        {...pageProps}
        isHome={isHome}
        // curScrollPos={curScrollPos}
        // prevScrollPos={prevScrollPos}
      />
    </ThemeModeProvider>
  );
}

export default MyApp;
