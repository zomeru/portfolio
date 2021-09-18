import React from 'react';
import BlogLayout from '@components/blogLayout';
import { customSeo, nextSeo } from 'src/configs/data';
import PageHead from '@components/pageHead';

interface BlogProps {
  theme: string;
  toggleTheme: () => void;
  isHome: boolean;
}

const Blog: React.FC<BlogProps> = ({ theme, toggleTheme, isHome }) => {
  return (
    <>
      <BlogLayout
        isHome={isHome}
        theme={theme}
        toggleTheme={toggleTheme}
        // seo={{ ...nextSeo }}
      >
        {/* <PageHead seo={{ ...customSeo }} /> */}
        <h2 className='section-heading'>My Blog Posts</h2>
      </BlogLayout>
    </>
  );
};

export default Blog;
