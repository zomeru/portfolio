import React, { useState, useEffect } from 'react';
import Head from 'next/head';
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
      <Head>
        <NextSeo {...seo} />
      </Head>
      <Nav isHome={isHome} theme={theme} toggleTheme={toggleTheme} />
      <main>{children}</main>
      <Footer />
    </StyledLayout>
  );
};

export default BlogLayout;
