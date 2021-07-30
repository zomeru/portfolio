import { Layout, About, Hero, Nav } from '../src/components/index';
import { GlobalStyles } from '../src/styles';

export default function Home() {
  return (
    <>
      <GlobalStyles />
      <Layout>
        <Nav />
        <Hero />
        <About />
      </Layout>
    </>
  );
}
