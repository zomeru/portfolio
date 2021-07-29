import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700&display=swap');
  
  :root {
    // Font
    --font-sans: 'Montserrat', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;

    // Colors
    --color-black: #000000;
    --color-gray-dark: #3d3d3d;
    --color-gray-mid: #848484;
    --color-gray-light: #bbbbbb;
    --color-white: #ffffff;
    --color-blue-dark: #1976d2;
    --color-blue-light: #90caf9;
    --color-blue-dark-o: rgba(25, 118, 210, 0.7);
    --color-blue-light-o: rgba(144, 202, 249, 0.7);

    // Font size
    --fz-xxs: 12px;
    --fz-xs: 13px;
    --fz-sm: 14px;
    --fz-md: 16px;
    --fz-lg: 18px;
    --fz-xl: 20px;
    --fz-xxl: 22px;
    --fz-heading: 32px;

    // Font weight
    --font-thin: 100;
    --font-extralight: 200;
    --font-light: 300;
    --font-regular: 400;
    --font-medium: 500;
    --font-semibold: 600;
    --font-bold: 700;

    // Border
    --border-radius-sm: 4px;

    // Margins
    --mg-xs: 5px;
    --mg-sm: 10px;
    --mg-md: 20px;
    --mg-lg: 30px;
    --mg-xl: 50px;
    --mg-xxl: 100px;

    // Padding
    --pd-xs: 2px;
    --pd-sm: 4px;
    --pd-md: 6px;
    --pd-lg: 8px;
    --pd-xl: 10px;
  }

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
    width: 12px;
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
