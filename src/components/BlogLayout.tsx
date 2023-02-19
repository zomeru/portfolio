import React from "react";
import { Nav, Footer, PageHead } from ".";
import { StyledLayout } from "../styles/componentStyles";

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
  return (
    <>
      <PageHead
        seo={{
          title: `${title}Blog | Zomer Gregorio`,
          url: `https://zomeru.com/blog${url}`,
          description,
          image,
          twitterUsername: "@zomeru_sama",
        }}
      />
      <StyledLayout id="root">
        <Nav isHome={isHome} />
        <main>{children}</main>
        <Footer />
      </StyledLayout>
    </>
  );
};

export default BlogLayout;
