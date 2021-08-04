import {
  About,
  Hero,
  Projects,
  Contact,
  Layout,
} from '../src/components/index';
import {
  GlobalStyles,
  lightTheme,
  darkTheme,
} from '../src/styles/otherStyles/GlobalStyles';
import { ThemeProvider } from 'styled-components';
import { useDarkMode } from '../src/hooks/useDarkMode';

const Home: React.FC<{ theme: any; toggleTheme: any }> = ({
  theme,
  toggleTheme,
}) => {
  // const [theme, toggleTheme] = useDarkMode();

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
