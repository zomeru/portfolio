import React from 'react';
import { Nav, Footer } from '.';
import { StyledLayout } from '../styles/componentStyles';

interface IBlogLayoutProps {
  children: React.ReactNode;
  isHome: boolean;
}

const BlogLayout: React.FC<IBlogLayoutProps> = ({ children, isHome }) => {
  return (
    <StyledLayout id='root'>
      <Nav isHome={isHome} />
      <main>{children}</main>
      <Footer />
    </StyledLayout>
  );
};

export default BlogLayout;
