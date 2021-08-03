import React from 'react';
import { Nav, Footer } from '.';
import { StyledLayout } from '../styles/componentStyles';

interface ILayoutProps {}

const Layout: React.FC<ILayoutProps> = ({ children }) => {
  return (
    <StyledLayout id='root'>
      <Nav />
      <main>{children}</main>
      <Footer />
    </StyledLayout>
  );
};

export default Layout;
