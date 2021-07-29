import React from 'react';
import { Hero, Head } from './index';

interface IlayoutProps {}

const Layout: React.FC<IlayoutProps> = ({}) => {
  return (
    <>
      <Head />

      <div id='root'>
        <Hero />
        <main></main>
      </div>
    </>
  );
};

export default Layout;
