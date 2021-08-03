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
    margin: 0 auto;
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
    overflowX: hidden;

    @media only screen and (max-width: 768px) {
      padding: 0 40px;
  }
  }

  section {
    max-width: var(--max-width);
    height: 100vh;
    margin: 0 auto;
    margin-bottom: 50px;
  }

  .section-heading {
    margin-bottom: 40px;
    width: 100%;
    color: var(--gray-dark);
    font-weight: var(--font-bold);
    font-size: clamp(35px, 6vw, var(--fz-heading));

    @media only screen and (max-width: 600px) {
      margin-bottom: 20px;
    }

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
