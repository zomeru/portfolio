import React from 'react';
import BlogLayout from '@components/blogLayout';

interface indexProps {
  theme: string;
  toggleTheme: () => void;
  isHome: boolean;
}

const index: React.FC<indexProps> = ({ theme, toggleTheme, isHome }) => {
  return (
    <BlogLayout isHome={isHome} theme={theme} toggleTheme={toggleTheme}>
      <h1>THIS IS MY BLOG POSTS</h1>
    </BlogLayout>
  );
};

export default index;
