import { useEffect, useState } from 'react';
import { customSeo } from '../src/configs/data';
import {
  Layout,
  About,
  Hero,
  Projects,
  Contact,
  PageHead,
} from '../src/components';
import Head from 'next/head';
import Script from 'next/script';
import { GA_TRACKING_ID } from 'lib/gtag';
interface IHomeProps {
  theme: string;
  toggleTheme: () => void;
  isHome: boolean;
}

const Home: React.FC<IHomeProps> = ({ theme, toggleTheme, isHome }) => {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <PageHead seo={{ ...customSeo }} />
      {isMounted && (
        <>
          <Head>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            />
            <Script>
              dangerouslySetInnerHTML=
              {{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_TRACKING_ID}', {
                  page_path: window.location.pathname,
              });
                `,
              }}
            </Script>
          </Head>
          <Layout
            isHome={isHome}
            theme={theme}
            toggleTheme={toggleTheme}
            seo={{ ...customSeo }}
          >
            <Hero />
            <About />
            <Projects />
            <Contact />
          </Layout>
        </>
      )}
    </>
  );
};

export default Home;
