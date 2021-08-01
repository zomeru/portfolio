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
    scrollbar-color: var(--gray-dark);
  }

  body::-webkit-scrollbar {
    width: 8px;
  }

  body::-webkit-scrollbar-thumb {
    background-color: var(--gray-dark);
    border-radius: 10px;
  }

  body {
    width: 100%;
    min-height: 100%;
    padding: 0 60px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--color-white);
    color: var(--gray-dark);
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
    /* margin: 10px 0 40px; */
    margin-bottom: 40px;
    width: 100%;
    white-space: nowrap;
    color: var(--gray-dark);
    font-weight: var(--font-bold);
    font-size: var(--fz-heading);

    /* :before {
      bottom: 4px;
      counter-increment: section;
      content: '0' counter(section) '.';
      margin-right: 10px;
      color: var(--blue-dark);
      font-size: clamp(var(--fz-md), 3vw, var(--fz-xl));
      font-weight: var(--font-medium);
    } */

    :after {
      bottom: 4px;
      counter-increment: section;
      content: '.';
      margin-left: 5px;
      color: var(--blue-dark);
      font-size: 65px;
      font-weight: var(--font-bold);
    }
  }

  a {
    text-decoration: none;
    transition: color 0.2s ease-out;

    :link,
    :active {
      color: var(--gray-dark);
    }

    :visited,
    :focus {
      color: var(--gray-dark);
    }

    :hover {
      color: var(--blue-dark)
    }
  }

  ol,
  ul {
    list-style: none;
  }
`;

export default GlobalStyles;
