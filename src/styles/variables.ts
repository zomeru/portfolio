import { css } from 'styled-components';

const variables = css`
  :root {
    // Font
    --font-sans: 'Poppins', -apple-system, sans-serif;

    // Colors
    --color-black: #000000;
    --color-gray-dark: #3d3d3d;
    --color-gray-mid: #848484;
    --color-gray-light: #bbbbbb;
    --color-white: #ffffff;
    --color-blue-dark: #1976d2;
    --color-blue-light: #90caf9;

    // Border
    --border-radius-sm: 4px;

    // Margins
    --mg-sm: 5px;
    --mg-md: 10px;
    --mg-lg: 20px;

    // Padding
    --pd-xs: 2px;
    --pd-sm: 4px;
    --pd-md: 6px;
    --pd-lg: 8px;
    --pd-xl: 10px;
  }
`;

export default variables;
