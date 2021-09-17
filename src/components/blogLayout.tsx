import React, { useState, useEffect } from 'react';
import { Nav, Footer } from '.';
import { StyledLayout } from '../styles/componentStyles';

interface IBlogLayoutProps {
  children: React.ReactNode;
  theme: string;
  toggleTheme: () => void;
  isHome: boolean;
}

const BlogLayout: React.FC<IBlogLayoutProps> = ({
  children,
  theme,
  toggleTheme,
  isHome,
}) => {
  return (
    <StyledLayout id='root'>
      <Nav isHome={isHome} theme={theme} toggleTheme={toggleTheme} />
      <main>{children}</main>
      <Footer />
    </StyledLayout>
  );
};

export default BlogLayout;
