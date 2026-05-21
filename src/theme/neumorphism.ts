// Legacy neumorphism module — gutted and re-pointed at the new design tokens.
// Keeps the same export surface so unmigrated screens compile, but the visual
// style is now the soft-modern look from the design handoff (no inset/extruded
// neumorphic shadows).

import { ViewStyle, Platform } from 'react-native';
import { lightPalette } from './tokens';

const p = lightPalette;

export const NeumorphismColors = {
  background: p.bg,
  surface: p.bgElev,

  // Legacy shadow names — kept but neutered (we now use elevation shadows)
  lightShadow: '#FFFFFF',
  darkShadow: p.shadow,

  // Variants
  light: p.bgPaper,
  medium: p.bgElev,
  dark: p.bgSunken,

  // Accents — mapped to new palette
  primary: p.primary,
  success: p.success,
  warning: p.amber,
  error: p.danger,

  // Text colors
  text: p.ink,
  textSecondary: p.ink2,
  textMuted: p.ink3,

  // Habit colors — re-keyed to the new 8-color palette but kept under the
  // original property names where reasonable so existing screens render.
  habitColors: {
    sage: p.habits.sage,
    lavender: p.habits.violet,
    coral: p.habits.rose,
    sky: p.habits.sky,
    peach: p.habits.amber,
    mint: p.habits.sage,
    rose: p.habits.rose,
    slate: p.slate,
    cream: p.habits.amber,
    dusty: p.habits.clay,
    ocean: p.habits.sky,
    forest: p.habits.moss,
  },
};

export const getRandomHabitColor = (): string => {
  const colors = Object.values(NeumorphismColors.habitColors);
  return colors[Math.floor(Math.random() * colors.length)];
};

export const getHabitColorByName = (colorName: string): string => {
  return (
    NeumorphismColors.habitColors[colorName as keyof typeof NeumorphismColors.habitColors] ??
    NeumorphismColors.habitColors.sage
  );
};

export type NeumorphismVariant = 'flat' | 'convex' | 'concave' | 'pressed';
export type NeumorphismSize = 'small' | 'medium' | 'large';

// Replaces the old extruded shadow with a clean elevated surface from the new
// design system. Variant and size are accepted but the visual is uniform.
export const createNeumorphismStyle = (
  variant: NeumorphismVariant = 'convex',
  size: NeumorphismSize = 'medium',
  color: string = NeumorphismColors.surface
): ViewStyle => {
  const radius = size === 'small' ? 14 : size === 'large' ? 20 : 16;

  // "concave" was used for inputs — render as a flat paper field
  if (variant === 'concave') {
    return {
      backgroundColor: p.bgPaper,
      borderRadius: radius,
      borderWidth: Platform.OS === 'web' ? 0 : 0,
    };
  }

  // "pressed" was used for active buttons — slightly recessed paper look
  if (variant === 'pressed') {
    return {
      backgroundColor: p.bgSunken,
      borderRadius: radius,
    };
  }

  // "flat" — subtle paper surface, no elevation
  if (variant === 'flat') {
    return {
      backgroundColor: p.bgPaper,
      borderRadius: radius,
    };
  }

  // "convex" — the new elevated card look
  return {
    backgroundColor: color || p.bgElev,
    borderRadius: radius,
    shadowColor: '#141428',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  };
};

export const NeumorphismUtils = {
  createDualShadow: (_size: NeumorphismSize = 'medium') => ({
    shadowColor: '#141428',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  }),
  createInsetShadow: (_size: NeumorphismSize = 'medium') => ({
    backgroundColor: p.bgPaper,
  }),
  createFloatingShadow: (_size: NeumorphismSize = 'medium') => ({
    shadowColor: '#141428',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 8,
  }),
};

export const NeumorphismPresets = {
  card: createNeumorphismStyle('convex', 'medium'),
  button: createNeumorphismStyle('convex', 'small'),
  input: createNeumorphismStyle('concave', 'medium'),
  fab: createNeumorphismStyle('convex', 'large'),
  header: createNeumorphismStyle('flat', 'small'),
  modal: createNeumorphismStyle('convex', 'large'),
};
