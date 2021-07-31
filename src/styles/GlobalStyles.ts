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
    scroll-behavior: smooth;
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
    font-weight: var(--font-regular);
    font-size: var(--fz-md);
    line-height: 1.3;
  }

  section {
    max-width: var(--max-width);
    height: 100vh;
    margin: 0 auto;
  }

  .section-heading {
    margin: 10px 0 40px;
    width: 100%;
    white-space: nowrap;
    font-weight: var(--font-semibold);
    font-size: var(--fz-heading);

    &:before {
      /* position: relative; */
      bottom: 4px;
      counter-increment: section;
      content: '0' counter(section) '.';
      margin-right: 10px;
      color: var(--color-blue-dark-o);
      font-size: clamp(var(--fz-md), 3vw, var(--fz-xl));
      font-weight: var(--font-medium);
    }
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
