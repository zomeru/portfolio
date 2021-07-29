import React from 'react';
import styled from 'styled-components';
import { GlobalStyles } from '../styles';
import { Hero, Head } from './index';

interface IlayoutProps {}

const Layout: React.FC<IlayoutProps> = ({}) => {
  return (
    <>
      <GlobalStyles />
      <Head />

      <div id='root'>
        <Hero />
        <main></main>
      </div>
    </>
  );
};

export default Layout;
