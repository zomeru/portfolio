export const lightTheme: any = {
  body: '#FAFAFA',
  textMain: '#474745',
  textSecond: '#7d7c79',
  accentMain: 'rgba(25, 118, 210, 0.7)',
  accentSecond: 'rgba(144, 202, 249, 0.7)',
  contentBG: 'rgba(144, 202, 249, 0.25)',
  contentBGSec: 'rgba(144, 202, 249, 0.35)',
};

export const darkTheme: any = {
  body: '#121212',
  textMain: '#FAFAFA',
  textSecond: '#9E9E9E',
  accentMain: '#40C4FF',
  accentSecond: 'rgba(144, 202, 249, 0.7)',
  contentBG: 'rgba(158, 158, 158, 0.10)',
  contentBGSec: 'rgba(158, 158, 158, 0.20)',
};

export type ThemeProps = {
  theme: typeof lightTheme | typeof darkTheme;
};
