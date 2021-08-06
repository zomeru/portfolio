//   accentMain: 'rgba(25, 118, 210, 0.7)',
//   accentSecond: 'rgba(144, 202, 249, 0.7)',
//   accentMain: '#40C4FF',

export const lightTheme: any = {
  body: '#f1f8f7',
  textMain: '#102039',
  textSecond: '#607d8b',
  accentMain: '#e94347',
  contentBG: 'rgba(233, 67, 71, 0.05)',
  contentBGSec: 'rgba(233, 67, 71, 0.1)',
  github: '#211F1F',
  bgBlur: 'rgba(0, 0, 0, 0.95)',
  menuNav: '#cfe7e4',
};

export const darkTheme: any = {
  body: '#102039',
  textMain: '#f1f8f7',
  textSecond: '#a6a6a6',
  accentMain: '#e94347',
  contentBG: 'rgba(233, 67, 71, 0.05)',
  contentBGSec: 'rgba(233, 67, 71, 0.1)',
  github: '#f1f8f7',
  bgBlur: '#102039',
  menuNav: '#142746',
};

export type ThemeProps = {
  theme: typeof lightTheme | typeof darkTheme;
};
