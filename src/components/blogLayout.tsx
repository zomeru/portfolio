import React, { useState, useEffect } from 'react';
import { Nav, Footer, PageHead } from '.';
import { StyledLayout } from '../styles/componentStyles';

interface IBlogLayoutProps {
  children: React.ReactNode;
  isHome: boolean;
  title: string;
  url: string;
  description: string;
  image: string;
}

const BlogLayout: React.FC<IBlogLayoutProps> = ({
  children,
  isHome,
  title,
  url,
  description,
  image,
}) => {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <PageHead
        seo={{
          title: `${title}Blog | Zomer Gregorio`,
          url: `https://zomer.xyz/blog${url}`,
          description,
          image,
          twitterUsername: '@zomeru_sama',
        }}
      />
      {isMounted && (
        <StyledLayout id='root'>
          <Nav isHome={isHome} />
          <main>{children}</main>
          <Footer />
        </StyledLayout>
      )}
    </>
  );
};

export default BlogLayout;
