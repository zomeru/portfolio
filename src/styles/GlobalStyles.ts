import { createGlobalStyle } from 'styled-components';
import { ThemeProps } from './theme';
import Variables from './variables';

export const GlobalStyles = createGlobalStyle<ThemeProps>`
  ${Variables}

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
    scrollbar-color: ${({ theme }) => theme.textMain};
  }

  body::-webkit-scrollbar {
    width: 6px;
  }

  body::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.textMain};
    border-radius: 10px;
  }

  body {
    margin: 0 auto;
    width: 100%;
    min-height: 100%;
    padding: 0 60px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${({ theme }) => theme.body};
    color: ${({ theme }) => theme.textMain};
    font-family: var(--font-sans);
    font-weight: var(--font-regular);
    font-size: var(--fz-md);
    line-height: 1.3;
    overflow-x: hidden;

    @media only screen and (max-width: 768px) {
      padding: 0 35px;
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
    color: ${({ theme }) => theme.textMain};
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
      color: ${({ theme }) => theme.accentMain};
      font-size: 65px;
      font-weight: var(--font-bold);
    }
  }

  p {
    @media only screen and (max-width: 480px) {
      font-size: var(--fz-sm);
    }
  }

  a {
    text-decoration: none;
    transition: color 0.2s ease-out;

    :link,
    :active {
      color: ${({ theme }) => theme.textMain};
    }

    :visited,
    :focus {
      color: ${({ theme }) => theme.textMain};
    }

    :hover {
      color: ${({ theme }) => theme.accentMain};
    }
  }

  ol,
  ul {
    list-style: none;
  }

  .link {
    color: ${({ theme }) => theme.textMain};
    position: relative;

    :hover ::after {
      width: 100%;
    }

    ::after {
      position: absolute;
      content: '';
      left: 0;
      bottom: -3px;
      height: 2px;
      border-radius: 1px;
      width: 0px;
      background-color: ${({ theme }) => theme.accentMain};
      transition: all .2s ease-in-out;
    }
  }
`;
