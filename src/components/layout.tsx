import React from 'react';
import { Nav, Footer } from '.';
import { StyledLayout } from '../styles/componentStyles';

interface ILayoutProps {
  children: React.ReactNode;
  theme: string;
  toggleTheme: () => void;
}

const Layout: React.FC<ILayoutProps> = ({ children, theme, toggleTheme }) => {
  return (
    <StyledLayout id='root'>
      <Nav theme={theme} toggleTheme={toggleTheme} />
      <main>{children}</main>
      <Footer />
    </StyledLayout>
  );
};

export default Layout;
