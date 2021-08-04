import {
  About,
  Hero,
  Projects,
  Contact,
  Layout,
} from '../src/components/index';

export default function Home() {
  return (
    <>
      <Layout>
        <Hero />
        <About />
        <Projects />
        <Contact />
      </Layout>
    </>
  );
}

export const getServerSideProps = async ({ req, res }: any) => {
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=10, stale-while-revalidate=59'
  );

  return {
    props: {
      time: new Date().toISOString(),
    },
  };
};
