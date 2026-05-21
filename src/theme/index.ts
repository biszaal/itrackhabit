// Legacy theme bridge — re-exports the new design tokens in the shape older
// screens still import. The new system lives in ./tokens + ./ThemeContext.
// Unmigrated screens will pick up the new colors automatically until they
// can be rewritten against useTheme().

import { lightPalette, radius, spacing, fontSize, fontWeight, shadow } from './tokens';

const p = lightPalette;

export const theme = {
  colors: {
    // primary surface
    primary: p.primary,
    primaryLight: p.primarySoft,
    primaryDark: p.primaryInk,
    primarySoft: p.primarySoft,

    // accents kept for backwards compatibility
    accent: p.habits.sky,
    accentLight: p.primarySoft,
    accentSoft: p.primary,

    secondary: p.amber,
    secondaryLight: '#FFF1DA',

    // backgrounds
    background: p.bg,
    backgroundSecondary: p.bgPaper,
    backgroundTertiary: p.bgSunken,
    surface: p.bgElev,
    surfaceElevated: p.bgElev,
    surfaceOverlay: p.bgElev,

    // text
    text: p.ink,
    textSecondary: p.ink2,
    textTertiary: p.ink3,
    textMuted: p.ink3,
    textDisabled: p.ink4,

    white: '#FFFFFF',

    border: p.line,
    borderSoft: p.lineSoft,
    borderAccent: p.primarySoft,
    divider: p.lineSoft,

    interactive: p.primary,
    interactiveHover: p.primary,
    interactivePressed: p.primaryInk,
    interactiveDisabled: p.ink4,

    success: p.success,
    successLight: '#E4F2E7',
    successSoft: '#A5D0AD',

    warning: p.amber,
    warningLight: '#FBEDD8',
    warningMuted: p.amber,
    warningSoft: '#F2C892',

    error: p.danger,
    errorLight: '#F6DAD4',
    errorSoft: '#E29A8E',

    info: p.primary,
    infoLight: p.primarySoft,
    infoSoft: p.primary,

    // legacy category colors mapped to new habit palette
    categoryBlue: p.habits.sky,
    categoryRed: p.habits.rose,
    categoryOrange: p.habits.amber,
    categoryGreen: p.habits.sage,
    categoryPurple: p.habits.violet,
    categoryPink: p.habits.rose,
    categoryYellow: p.habits.amber,
    categoryTeal: p.habits.sky,
    categoryIndigo: p.habits.indigo,

    lightShadow: '#FFFFFF',
    darkShadow: p.shadow,
    overlay: p.overlay,
    overlayLight: 'rgba(11,16,32,0.25)',
    backdrop: p.overlay,

    shimmer: p.bgPaper,
    shimmerHighlight: p.bgElev,
    particle: p.primarySoft,
    glow: p.primary,

    // misc legacy
    whiteDeprecated: '#FFFFFF',
    blue: p.habits.sky,
    orange: p.habits.amber,
    purple: p.habits.violet,
    green: p.habits.sage,
    pink: p.habits.rose,
    indigo: p.habits.indigo,
    teal: p.habits.sky,
    yellow: p.habits.amber,
    lightGreen: p.success,
    lightRed: p.danger,
    lightOrange: p.amber,
  },

  spacing: {
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
    xxl: spacing.xxl,
    xxxl: 40,
    section: spacing.xl,
    card: spacing.lg,
    button: spacing.md,
  },

  borderRadius: {
    none: 0,
    xs: 2,
    sm: 6,
    md: 8,
    lg: 12,
    xl: radius.input,
    xxl: radius.card,
    full: radius.pill,
  },

  fontSize: {
    xs: fontSize.xs,
    sm: fontSize.sm,
    md: fontSize.body,
    lg: 17,
    xl: fontSize.title,
    xxl: 22,
    xxxl: 26,
    title: fontSize.titleXl,
    hero: 40,
    display: fontSize.display,
  },

  fontWeight: {
    thin: '100' as const,
    extralight: '200' as const,
    light: '300' as const,
    normal: fontWeight.regular,
    medium: fontWeight.medium,
    semibold: fontWeight.semibold,
    bold: fontWeight.bold,
    extrabold: fontWeight.extrabold,
    black: '900' as const,
  },

  animation: {
    duration: { fast: 150, normal: 250, slow: 350, slower: 500, slowest: 750 },
    scale: { press: 0.97, hover: 1.02, pop: 1.06 },
    spring: {
      default: { damping: 18, stiffness: 180 },
      bouncy: { damping: 12, stiffness: 140 },
      gentle: { damping: 22, stiffness: 200 },
    },
  },

  shadows: {
    none: {},
    subtle: shadow.sh1,
    sm: shadow.sh1,
    md: shadow.sh2,
    lg: shadow.sh2,
    xl: shadow.sh3,
    button: shadow.pill,
    card: shadow.sh2,
    floating: shadow.sh3,
  },

  neumorphism: {
    background: p.bg,
    surface: p.bgElev,
    lightShadow: '#FFFFFF',
    darkShadow: p.shadow,
  },
} as const;

export type Theme = typeof theme;

export { lightPalette, darkPalette, radius, spacing, fontSize, fontWeight, shadow } from './tokens';
export { ThemeProvider, useTheme } from './ThemeContext';
