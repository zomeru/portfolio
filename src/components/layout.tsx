import React from 'react';
import styled from 'styled-components';

interface IlayoutProps {}

const StyledLayout = styled.div`
  height: 100vh;
  max-width: var(--max-width);
  margin: 0 auto;
`;

const Layout: React.FC<IlayoutProps> = ({ children }) => {
  return <StyledLayout id='root'>{children}</StyledLayout>;
};

export default Layout;
