import { createContext, useMemo, ReactNode, FC } from "react";
import { ThemeProvider } from "styled-components";

import { useDarkMode, ThemeMode } from "src/hooks/useDarkMode";
import { darkTheme, lightTheme } from "src/styles/theme";

interface IThemeModeContext {
  theme: ThemeMode;
  toggleTheme: () => void;
}

export const ThemeModeContext = createContext({} as IThemeModeContext);

interface IThemeModeProvider {
  children: ReactNode;
}

export const ThemeModeProvider: FC<IThemeModeProvider> = ({ children }) => {
  const [theme, toggleTheme] = useDarkMode();
  const themeMode = theme === "light" ? lightTheme : darkTheme;

  const value = useMemo(() => {
    return { theme, toggleTheme };
  }, [theme, toggleTheme]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={themeMode}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  );
};
