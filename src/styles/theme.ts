interface Theme {
  body: string;
  textMain: string;
  textSecond: string;
  accentMain: string;
  floatBG: string;
  menuNav: string;
  chatGPTInput: string;
  blogTitleCard: string;
}

export const lightTheme: Theme = {
  body: "#E8EEF1", // WHITE
  textMain: "#1E3D58", // NAVY BLUE
  textSecond: "#607d8b", // BLUE-ISH GRAY
  accentMain: "#057DCD", // ROYAL BLUE
  floatBG: "#d3edfe",
  menuNav: "#cfe7e4",
  chatGPTInput: "#c1d3d1",
  blogTitleCard: "rgba(232, 238, 241, 0.85)",
};

export const darkTheme: Theme = {
  body: "#0d1a25", // NAVY BLUE
  textMain: "#E8EEF1", // WHITE
  textSecond: "#9e9e9e", // GRAY
  accentMain: "#43B0F1", // BLUE GROTTO
  floatBG: "#011827",
  menuNav: "#142746",
  chatGPTInput: "#162336",
  blogTitleCard: "rgba(13, 26, 37, 0.85)",
};

export type ThemeProps = {
  theme: typeof lightTheme | typeof darkTheme;
};
