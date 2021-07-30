import { Layout, About, Hero } from '../src/components/index';
import { GlobalStyles } from '../src/styles';

export default function Home() {
  return (
    <>
      <GlobalStyles />
      <Layout>
        <Hero />
        <About />
      </Layout>
    </>
  );
}
