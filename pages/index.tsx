import {
  About,
  Hero,
  Projects,
  Contact,
  Layout,
} from '../src/components/index';

const Home: React.FC<{ theme: any; toggleTheme: any }> = ({
  theme,
  toggleTheme,
}) => {
  return (
    <Layout theme={theme} toggleTheme={toggleTheme}>
      <Hero />
      <About />
      <Projects />
      <Contact />
    </Layout>
  );
};

export default Home;

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
