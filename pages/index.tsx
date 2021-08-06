import {
  About,
  Hero,
  Projects,
  Contact,
  Layout,
} from '../src/components/index';

interface IHomeProps {
  theme: string;
  toggleTheme: () => void;
  isHome: boolean;
}

const Home: React.FC<IHomeProps> = ({ theme, toggleTheme, isHome }) => {
  return (
    <Layout isHome={isHome} theme={theme} toggleTheme={toggleTheme}>
      <Hero />
      <About />
      <Projects />
      <Contact />
    </Layout>
  );
};

export default Home;

// export const getServerSideProps = async ({ req, res }: any) => {
//   res.setHeader(
//     'Cache-Control',
//     'public, s-maxage=10, stale-while-revalidate=59'
//   );

//   return {
//     props: {
//       time: new Date().toISOString(),
//     },
//   };
// };
