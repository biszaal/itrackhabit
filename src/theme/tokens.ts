// Design tokens — matches handoff bundle iTrackHabit Redesign v2.0
// OKLCH values from tokens.css converted to hex for React Native.

export type ColorScheme = 'light' | 'dark';

export interface Palette {
  bg: string;
  bgElev: string;
  bgPaper: string;
  bgSunken: string;
  line: string;
  lineSoft: string;
  ink: string;
  ink2: string;
  ink3: string;
  ink4: string;

  primary: string;
  primarySoft: string;
  primaryInk: string;

  sage: string;
  sand: string;
  slate: string;
  rose: string;
  amber: string;
  success: string;
  danger: string;

  habits: {
    indigo: string;
    sage: string;
    rose: string;
    amber: string;
    sky: string;
    violet: string;
    clay: string;
    moss: string;
  };

  shadow: string;
  overlay: string;
}

const habitPalette = {
  indigo: '#6366F1',
  sage: '#7C9B7E',
  rose: '#E07A77',
  amber: '#E0A864',
  sky: '#6FA8C7',
  violet: '#9B7BC7',
  clay: '#C28267',
  moss: '#5A7A52',
};

export const lightPalette: Palette = {
  bg: '#FAFAF7',
  bgElev: '#FFFFFF',
  bgPaper: '#F4F2EC',
  bgSunken: '#EEEBE4',
  line: '#E2E0D8',
  lineSoft: '#EAE7DF',
  ink: '#1C1F2E',
  ink2: '#525866',
  ink3: '#828791',
  ink4: '#B3B6BD',

  primary: '#6366F1',
  primarySoft: '#E8E6F8',
  primaryInk: '#4E3CC2',

  sage: '#7C9B7E',
  sand: '#D4B896',
  slate: '#64748B',
  rose: '#E07A77',
  amber: '#E0A864',
  success: '#4D8B58',
  danger: '#B7493B',

  habits: habitPalette,
  shadow: 'rgba(20, 20, 40, 0.08)',
  overlay: 'rgba(11, 16, 32, 0.5)',
};

export const darkPalette: Palette = {
  bg: '#1A1C24',
  bgElev: '#232631',
  bgPaper: '#22252F',
  bgSunken: '#15171F',
  line: '#2F323C',
  lineSoft: '#2A2C36',
  ink: '#F2EFE9',
  ink2: '#B5B7BE',
  ink3: '#828791',
  ink4: '#595D6A',

  primary: '#818CF8',
  primarySoft: '#38394E',
  primaryInk: '#A7A0F2',

  sage: '#7C9B7E',
  sand: '#D4B896',
  slate: '#94A3B8',
  rose: '#E07A77',
  amber: '#E0A864',
  success: '#5FB37A',
  danger: '#E07A77',

  habits: habitPalette,
  shadow: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export const radius = {
  card: 20,
  cardSm: 16,
  input: 14,
  chip: 10,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  screen: 20,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  body: 15,
  title: 20,
  h: 17,
  titleLg: 26,
  titleXl: 28,
  display: 44,
  mega: 68,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const shadow = {
  // RN-compatible shadow tiers
  sh1: {
    shadowColor: '#141428',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sh2: {
    shadowColor: '#141428',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  sh3: {
    shadowColor: '#141428',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 8,
  },
  pill: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const getHabitColors = (palette: Palette): string[] => [
  palette.habits.indigo,
  palette.habits.sage,
  palette.habits.rose,
  palette.habits.amber,
  palette.habits.sky,
  palette.habits.violet,
  palette.habits.clay,
  palette.habits.moss,
];

export const getRandomHabitColor = (palette: Palette = lightPalette): string => {
  const list = getHabitColors(palette);
  return list[Math.floor(Math.random() * list.length)];
};
