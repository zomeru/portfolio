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
  theme: string;
  toggleTheme: () => void;
  isHome: boolean;
}

const Home: React.FC<IHomeProps> = ({ theme, toggleTheme, isHome }) => {
  return (
    <>
      <PageHead seo={{ ...customSeo }} />
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
  );
};

export default Home;
