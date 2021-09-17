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
      <h2 className='section-heading'>My Blog Posts</h2>
    </BlogLayout>
  );
};

export default index;
