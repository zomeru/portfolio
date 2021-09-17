import React from 'react';
import BlogLayout from '@components/blogLayout';
import { nextSeo } from 'src/configs/data';

interface indexProps {
  theme: string;
  toggleTheme: () => void;
  isHome: boolean;
}

const index: React.FC<indexProps> = ({ theme, toggleTheme, isHome }) => {
  // const router = useRouter();
  // const isHome = window.location.pathname === '/';

  return (
    <BlogLayout
      isHome={isHome}
      theme={theme}
      toggleTheme={toggleTheme}
      seo={{ ...nextSeo }}
    >
      <h2 className='section-heading'>My Blog Posts</h2>
    </BlogLayout>
  );
};

export default index;
