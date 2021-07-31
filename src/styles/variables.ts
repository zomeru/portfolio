import { css } from 'styled-components';

const Variables = css`
  :root {
    // Font
    --font-sans: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI',
      Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue',
      sans-serif;

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
    --fz-heading: 40px;

    // Font weight
    --font-thin: 100;
    --font-extralight: 200;
    --font-light: 300;
    --font-regular: 400;
    --font-medium: 500;
    --font-semibold: 600;
    --font-bold: 700;

    // Other
    --nav-height: 100px;
    --max-width: 1400px;

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
`;

export default Variables;
