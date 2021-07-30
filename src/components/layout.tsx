import React from 'react';
import styled from 'styled-components';
import { Hero } from './index';

interface IlayoutProps {}

const StyledContent = styled.main`
  min-height: 100vh;
`;

const Layout: React.FC<IlayoutProps> = ({ children }) => {
  return (
    <div id='root'>
      <Hero />
      <StyledContent>{children}</StyledContent>
    </div>
  );
};

export default Layout;
