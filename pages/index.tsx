import {
  About,
  Hero,
  Projects,
  Contact,
  Layout,
} from '../src/components/index';
import GlobalStyles from '../src/styles/otherStyles/GlobalStyles';

export default function Home() {
  return (
    <>
      <GlobalStyles />
      <Layout>
        <Hero />
        <About />
        <Projects />
        <Contact />
      </Layout>
    </>
  );
}
