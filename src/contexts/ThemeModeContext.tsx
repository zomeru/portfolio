import { createContext } from 'react';
import { ThemeProvider } from 'styled-components';
import { useDarkMode } from 'src/hooks/useDarkMode';
import { darkTheme, lightTheme } from 'src/styles/theme';

export const ThemeModeContext = createContext(null);

export const ThemeModeProvider = ({ children }) => {
  const [theme, toggleTheme] = useDarkMode();
  const themeMode = theme === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeModeContext.Provider value={{ themeMode, toggleTheme }}>
      <ThemeProvider theme={themeMode}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  );
};
