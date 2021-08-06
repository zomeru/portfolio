import { css } from 'styled-components';

const Variables = css`
  :root {
    // Font
    --font-sans: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI',
      Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue',
      sans-serif;

    // Font size
    --fz-xxs: 12px;
    --fz-xs: 13px;
    --fz-sm: 14px;
    --fz-md: 16px;
    --fz-lg: 18px;
    --fz-xl: 20px;
    --fz-xxl: 22px;
    --fz-heading: 50px;

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
    --bdr-xxs: 1px;
    --bdr-xs: 2px;
    --bdr-sm: 3px;
    --bdr-md: 4px;
    --bdr-lg: 5px;
    --bdr-xl: 8px;
    --bdr-xxl: 10px;
    --bdr-full: 100px;

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
