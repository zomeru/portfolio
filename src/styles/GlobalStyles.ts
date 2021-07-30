import { createGlobalStyle } from 'styled-components';
import Variables from './variables';

const GlobalStyles = createGlobalStyle`
  ${Variables};

  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    box-sizing: inherit;
    width: 100%;
  }

  // Scrollbar styles 
  html {
    scrollbar-width: thin;
    scrollbar-color: var(--color-gray-dark);
  }

  body::-webkit-scrollbar {
    width: 8px;
  }

  body::-webkit-scrollbar-thumb {
    background-color: var(--color-gray-dark);
    border-radius: 10px;
  }

  body {
    width: 100%;
    min-height: 100%;
    padding: 0 60px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--color-white);
    color: var(--color-black);
    font-family: var(--font-sans);
    font-weight: 400;
    font-size: var(--fz-md);
  }

  a {
    text-decoration: none;
  }

  ol,
  ul {
    list-style: none;
  }


`;

export default GlobalStyles;
