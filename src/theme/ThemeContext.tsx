import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorScheme, Palette, lightPalette, darkPalette, radius, spacing, fontSize, fontWeight, shadow, getHabitColors } from './tokens';

interface ThemeValue {
  scheme: ColorScheme;
  mode: ColorScheme | 'system';
  colors: Palette;
  radius: typeof radius;
  spacing: typeof spacing;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  shadow: typeof shadow;
  habitColors: string[];
  isDark: boolean;
  setMode: (m: ColorScheme | 'system') => void;
  toggle: () => void;
}

const STORAGE_KEY = '@itrackhabit:theme-mode';

const ThemeCtx = createContext<ThemeValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ColorScheme | 'system'>('system');
  const [systemScheme, setSystemScheme] = useState<ColorScheme>(
    (Appearance.getColorScheme() as ColorScheme) || 'light'
  );

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored);
        }
      } catch {}
    })();
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme === 'light' || colorScheme === 'dark') {
        setSystemScheme(colorScheme);
      }
    });
    return () => sub.remove();
  }, []);

  const setMode = useCallback((m: ColorScheme | 'system') => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  const scheme: ColorScheme = mode === 'system' ? systemScheme : mode;
  const isDark = scheme === 'dark';

  const value = useMemo<ThemeValue>(() => {
    const colors = isDark ? darkPalette : lightPalette;
    return {
      scheme,
      mode,
      colors,
      radius,
      spacing,
      fontSize,
      fontWeight,
      shadow,
      habitColors: getHabitColors(colors),
      isDark,
      setMode,
      toggle: () => setMode(isDark ? 'light' : 'dark'),
    };
  }, [scheme, isDark, mode, setMode]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
};

export const useTheme = (): ThemeValue => {
  const v = useContext(ThemeCtx);
  if (!v) {
    // Fallback to light theme if provider missing — keeps screens renderable in tests
    return {
      scheme: 'light',
      mode: 'system',
      colors: lightPalette,
      radius,
      spacing,
      fontSize,
      fontWeight,
      shadow,
      habitColors: getHabitColors(lightPalette),
      isDark: false,
      setMode: () => {},
      toggle: () => {},
    };
  }
  return v;
};
