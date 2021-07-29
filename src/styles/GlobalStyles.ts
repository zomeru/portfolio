import { createGlobalStyle } from 'styled-components';
import { variables } from './index';

const GlobalStyles = createGlobalStyle`
  html {
    box-sizing: border-box;
    width: 100%;
  }

  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }

  // Scrollbar styles 
  html {
    scrollbar-width: thin;
    scrollbar-color: var(--color-gray-dark);
  }

  body::-webkit-scrollbar {
    width: 12px;
  }

  body::-webkit-scrollbar-thumb {
    background-color: var(--color-gray-dark);
    border-radius: 10px;
  }


`;

export default GlobalStyles;
