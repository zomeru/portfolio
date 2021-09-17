import React, { useState, useEffect } from 'react';
import { NextSeo, NextSeoProps } from 'next-seo';
import { Nav, Footer } from '.';
import { StyledLayout } from '../styles/componentStyles';

interface IBlogLayoutProps {
  children: React.ReactNode;
  theme: string;
  toggleTheme: () => void;
  isHome: boolean;
  seo?: NextSeoProps;
}

const BlogLayout: React.FC<IBlogLayoutProps> = ({
  children,
  theme,
  toggleTheme,
  isHome,
  seo,
}) => {
  return (
    <StyledLayout id='root'>
      <NextSeo {...seo} />
      <Nav isHome={isHome} theme={theme} toggleTheme={toggleTheme} />
      <main>{children}</main>
      <Footer />
    </StyledLayout>
  );
};

export default BlogLayout;
