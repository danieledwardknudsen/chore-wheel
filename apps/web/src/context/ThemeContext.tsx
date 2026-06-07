'use client';

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { ThemePrimitives } from '@/themes/types';
import { themes } from '@/themes/index';

type ThemeContextValue = {
  primitives: ThemePrimitives;
  themeName: string;
  setTheme: (name: string) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DEFAULT_THEME = 'terminal';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeName, setThemeName] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    const stored = localStorage.getItem('chore-wheel-theme');
    return stored && themes[stored] ? stored : DEFAULT_THEME;
  });

  const setTheme = (name: string) => {
    if (!themes[name]) return;
    localStorage.setItem('chore-wheel-theme', name);
    setThemeName(name);
  };

  const primitives = themes[themeName] ?? themes[DEFAULT_THEME]!;

  return (
    <ThemeContext.Provider value={{ primitives, themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};
