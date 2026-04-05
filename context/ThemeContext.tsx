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
    bg: '#0f1117',
    card: '#1a1d27',
    cardBorder: '#2a2d3e',
    text: '#ffffff',
    textMuted: '#9ca3af',
    tabBg: '#13151f',
    tabBorder: '#2a2d3e',
    inputBg: '#0d0f17',
    inputBorder: '#2a2d3e',
    headerBg: '#13151f',
    divider: '#2a2d3e',
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
