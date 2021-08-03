import React from 'react';
import { Nav, Footer } from '.';
import { StyledLayout } from '../styles/componentStyles';

interface IlayoutProps {}

const Layout: React.FC<IlayoutProps> = ({ children }) => {
  return (
    <StyledLayout id='root'>
      <Nav />
      <main>{children}</main>
      <Footer />
    </StyledLayout>
  );
};

export default Layout;
