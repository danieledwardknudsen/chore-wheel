import type { ThemePrimitives } from './types';
import { terminalTheme } from './terminal/index';

export const themes: Record<string, ThemePrimitives> = {
  terminal: terminalTheme,
};
