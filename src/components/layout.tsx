import React from 'react';
import styled from 'styled-components';
import { Nav, Footer } from '.';

interface IlayoutProps {}

const StyledLayout = styled.div`
  height: 100vh;
  max-width: var(--max-width);
  margin: 0 auto;
`;

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
