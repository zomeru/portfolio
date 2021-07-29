import React from 'react';
import { GlobalStyles } from '../styles';
import { Hero, Head } from './index';

interface IlayoutProps {}

const Layout: React.FC<IlayoutProps> = ({}) => {
  return (
    <>
      <Head />
      <GlobalStyles />
      <div id='root'>
        <Hero />
        <main></main>
      </div>
    </>
  );
};

export default Layout;
