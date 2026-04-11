'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'dark' | 'light';

export interface ThemeColors {
  bg: string;
  card: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  tabBg: string;
  tabBorder: string;
  inputBg: string;
  inputBorder: string;
  headerBg: string;
  divider: string;
}

export const THEME_COLORS: Record<Theme, ThemeColors> = {
  dark: {
    bg: '#090c14',
    card: '#111520',
    cardBorder: '#1e2235',
    text: '#f0f2f8',
    textMuted: '#8891a8',
    tabBg: '#0b0e18',
    tabBorder: '#1e2235',
    inputBg: '#090c14',
    inputBorder: '#1e2235',
    headerBg: '#0b0e18',
    divider: '#1e2235',
  },
  light: {
    bg: '#FAF9F6',
    card: '#FFFFFF',
    cardBorder: '#e8e4dc',
    text: '#1a1a1a',
    textMuted: '#6b7280',
    tabBg: '#FFFFFF',
    tabBorder: '#e8e4dc',
    inputBg: '#FFFFFF',
    inputBorder: '#e8e4dc',
    headerBg: '#FFFFFF',
    divider: '#e8e4dc',
  },
};

interface ThemeContextType {
  theme: Theme;
  c: ThemeColors;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  themeLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  c: THEME_COLORS.dark,
  toggleTheme: () => {},
  setTheme: () => {},
  themeLoaded: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('chartchamp_theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') setThemeState(saved);
    setThemeLoaded(true);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('chartchamp_theme', t);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, c: THEME_COLORS[theme], toggleTheme, setTheme, themeLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
