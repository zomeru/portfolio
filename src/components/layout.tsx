import React from 'react';
import styled from 'styled-components';

interface IlayoutProps {}

const StyledLayout = styled.div`
  height: 100vh;
`;

const Layout: React.FC<IlayoutProps> = ({ children }) => {
  return <StyledLayout id='root'>{children}</StyledLayout>;
};

export default Layout;
