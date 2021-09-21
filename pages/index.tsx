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
interface IHomeProps {
  isHome: boolean;
  // curScrollPos: number;
  // prevScrollPos: number;
}

const Home: React.FC<IHomeProps> = ({
  isHome,
  // prevScrollPos,
  // curScrollPos,
}) => {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <PageHead seo={{ ...customSeo }} />
      {isMounted && (
        <Layout
          isHome={isHome}
          seo={{ ...customSeo }}
          // prevScrollPos={prevScrollPos}
          // curScrollPos={curScrollPos}
        >
          <Hero />
          <About />
          <Projects />
          <Contact />
        </Layout>
      )}
    </>
  );
};

export default Home;
