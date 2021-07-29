import { css } from 'styled-components';

import TTHovesThinWoff from '../fonts/TTHoves/TTHoves-Thin.woff';
import TTHovesThinWoff2 from '../fonts/TTHoves/TTHoves-Thin.woff2';

import TTHovesExtraLightWoff from '../fonts/TTHoves/TTHoves-ExtraLight.woff';
import TTHovesExtraLightWoff2 from '../fonts/TTHoves/TTHoves-ExtraLight.woff2';
import TTHovesLightWoff from '../fonts/TTHoves/TTHoves-Light.woff';
import TTHovesLightWoff2 from '../fonts/TTHoves/TTHoves-Light.woff2';

import TTHovesRegularWoff from '../fonts/TTHoves/TTHoves-Regular.woff';
import TTHovesRegularWoff2 from '../fonts/TTHoves/TTHoves-Regular.woff2';
import TTHovesMediumWoff from '../fonts/TTHoves/TTHoves-Medium.woff';
import TTHovesMediumWoff2 from '../fonts/TTHoves/TTHoves-Medium.woff2';

import TTHovesSemiboldWoff from '../fonts/TTHoves/TTHoves-DemiBold.woff';
import TTHovesSemiboldWoff2 from '../fonts/TTHoves/TTHoves-DemiBold.woff2';
import TTHovesBoldWoff from '../fonts/TTHoves/TTHoves-Bold.woff';
import TTHovesBoldWoff2 from '../fonts/TTHoves/TTHoves-Bold.woff2';

const ttHovesWeights = {
  100: [TTHovesThinWoff, TTHovesThinWoff2],
  200: [TTHovesExtraLightWoff, TTHovesExtraLightWoff2],
  300: [TTHovesLightWoff, TTHovesLightWoff2],
  400: [TTHovesRegularWoff, TTHovesRegularWoff2],
  500: [TTHovesMediumWoff, TTHovesMediumWoff2],
  600: [TTHovesSemiboldWoff, TTHovesSemiboldWoff2],
  700: [TTHovesBoldWoff, TTHovesBoldWoff2],
};

const tthoves = {
  name: 'TT Hoves',
  normal: ttHovesWeights,
};

const createFontFaces = (family: any, style: any = 'normal'): any => {
  let styles = '';

  let weight: any;
  let formats: any;

  for ([weight, formats] of Object.entries(family[style])) {
    const woff = formats[0];
    const woff2 = formats[1];

    styles += `
      @font-face {
        font-family: '${family.name}';
        src: url(${woff2}) format('woff2'), url(${woff}) format('woff');
        font-weight: ${weight};
        font-style: ${style};
        font-display: auto;
      }
    `;
  }

  return styles;
};

const ttHovesNormal = createFontFaces(tthoves);

const Fonts = css`
  ${ttHovesNormal}
`;

export default Fonts;
