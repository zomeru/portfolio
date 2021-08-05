// export const lightTheme: any = {
//   body: '#FAFAFA',
//   textMain: '#474745',
//   textSecond: '#7d7c79',
//   accentMain: 'rgba(25, 118, 210, 0.7)',
//   accentSecond: 'rgba(144, 202, 249, 0.7)',
//   contentBG: 'rgba(144, 202, 249, 0.25)',
//   contentBGSec: 'rgba(144, 202, 249, 0.35)',
// };

// export const darkTheme: any = {
//   body: '#121212',
//   textMain: '#FAFAFA',
//   textSecond: '#9E9E9E',
//   accentMain: '#40C4FF',
//   accentSecond: 'rgba(144, 202, 249, 0.7)',
//   contentBG: 'rgba(158, 158, 158, 0.10)',
//   contentBGSec: 'rgba(158, 158, 158, 0.20)',
// };

export const lightTheme: any = {
  body: '#f1f8f7',
  textMain: '#102039',
  // textSecond: '#78909c',
  textSecond: '#607d8b',
  accentMain: '#e94347',
  // accentSecond: 'rgba(144, 202, 249, 0.7)',
  contentBG: 'rgba(233, 67, 71, 0.05)',
  contentBGSec: 'rgba(233, 67, 71, 0.1)',
  github: '#211F1F',
};

export const darkTheme: any = {
  body: '#102039',
  textMain: '#f1f8f7',
  textSecond: '#a6a6a6',
  accentMain: '#e94347',
  // accentSecond: 'rgba(144, 202, 249, 0.7)',
  contentBG: 'rgba(233, 67, 71, 0.05)',
  contentBGSec: 'rgba(233, 67, 71, 0.1)',
  github: '#f1f8f7',
};

export type ThemeProps = {
  theme: typeof lightTheme | typeof darkTheme;
};
