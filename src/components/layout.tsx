import React, { useRef } from 'react';
import styled from 'styled-components';
import { Hero } from './index';

interface IlayoutProps {}

const StyledContent = styled.main`
  min-height: 100vh;
`;

const Layout: React.FC<IlayoutProps> = ({ children }) => {
  const containerRef = useRef(null);
  return (
    <div id='root'>
      <Hero />
      <StyledContent data-scroll-container ref={containerRef}>
        {children}
      </StyledContent>
    </div>
  );
};

export default Layout;
