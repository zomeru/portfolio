export const lightTheme: any = {
  body: '#E8EEF1', // WHITE
  textMain: '#1E3D58', // NAVY BLUE
  textSecond: '#607d8b', // BLUE-ISH GRAY
  accentMain: '#057DCD', // ROYAL BLUE
  floatBG: '#d3edfe',
  menuNav: '#cfe7e4',
};

export const darkTheme: any = {
  body: '#0d1a25', // NAVY BLUE
  textMain: '#E8EEF1', // WHITE
  textSecond: '#9e9e9e', // GRAY
  accentMain: '#43B0F1', // BLUE GROTTO
  floatBG: '#011827',
  menuNav: '#142746',
};

export type ThemeProps = {
  theme: typeof lightTheme | typeof darkTheme;
};
