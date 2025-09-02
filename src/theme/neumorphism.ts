import { ViewStyle } from 'react-native';

// Neumorphism color palette
export const NeumorphismColors = {
  background: '#E0E5EC',
  surface: '#E0E5EC',
  
  // Shadow colors
  lightShadow: '#FFFFFF',
  darkShadow: '#A3B1C6',
  
  // Variants
  light: '#F0F5FC',
  medium: '#E0E5EC',
  dark: '#D1D9E6',
  
  // Accent colors
  primary: '#667eea',
  success: '#48bb78',
  warning: '#ed8936',
  error: '#f56565',
  
  // Text colors
  text: '#2D3748',
  textSecondary: '#4A5568',
  textMuted: '#718096',
  
  // Soft habit colors (muted and gentle)
  habitColors: {
    sage: '#A8B5A0',      // Muted green
    lavender: '#B8A9D9',  // Soft purple  
    coral: '#D4A5A5',     // Muted coral
    sky: '#A5C4D4',       // Soft blue
    peach: '#D4B5A5',     // Warm peach
    mint: '#A5D4C4',      // Gentle mint
    rose: '#D4A5B5',      // Soft rose
    slate: '#A5A8B5',     // Muted slate
    cream: '#D4D1A5',     // Soft yellow-cream
    dusty: '#B5A8A5',     // Dusty brown
    ocean: '#A5B5D4',     // Ocean blue
    forest: '#A8C4A5',    // Forest green
  },
};

// Utility function to get a random habit color
export const getRandomHabitColor = (): string => {
  const colors = Object.values(NeumorphismColors.habitColors);
  return colors[Math.floor(Math.random() * colors.length)];
};

// Utility function to get habit color by name
export const getHabitColorByName = (colorName: string): string => {
  return NeumorphismColors.habitColors[colorName as keyof typeof NeumorphismColors.habitColors] || NeumorphismColors.habitColors.sage;
};

export type NeumorphismVariant = 'flat' | 'convex' | 'concave' | 'pressed';
export type NeumorphismSize = 'small' | 'medium' | 'large';

interface NeumorphismConfig {
  variant: NeumorphismVariant;
  size: NeumorphismSize;
  color?: string;
}

export const createNeumorphismStyle = (
  variant: NeumorphismVariant = 'convex',
  size: NeumorphismSize = 'medium',
  color: string = NeumorphismColors.surface
): ViewStyle => {
  try {
    // Calculate shadow distances based on size
    const shadowConfig: Record<NeumorphismSize, { distance: number; blur: number }> = {
      small: { distance: 4, blur: 8 },
      medium: { distance: 8, blur: 16 },
      large: { distance: 12, blur: 24 },
    };

    const config = shadowConfig[size] || shadowConfig.medium;
    if (!config) {
      console.warn('Invalid neumorphism size:', size);
      return { backgroundColor: color || NeumorphismColors.surface, borderRadius: 12 };
    }
    
    const { distance, blur } = config;

    const baseStyle: ViewStyle = {
      backgroundColor: color,
      borderRadius: 12,
    };

    switch (variant) {
      case 'convex':
        // Raised/extruded look
        return {
          ...baseStyle,
          shadowColor: NeumorphismColors.darkShadow,
          shadowOffset: { width: distance, height: distance },
          shadowOpacity: 0.3,
          shadowRadius: blur,
          elevation: 8,
          // Additional light shadow for iOS
          ...(Platform.OS === 'ios' && {
            shadowColor: NeumorphismColors.lightShadow,
            shadowOffset: { width: -distance, height: -distance },
            shadowOpacity: 0.7,
          }),
        };

      case 'concave':
        // Inset/pressed look
        return {
          ...baseStyle,
          shadowColor: NeumorphismColors.darkShadow,
          shadowOffset: { width: -distance, height: -distance },
          shadowOpacity: 0.3,
          shadowRadius: blur,
          elevation: -4,
        };

      case 'pressed':
        // Button pressed state
        return {
          ...baseStyle,
          backgroundColor: NeumorphismColors.dark,
          shadowColor: NeumorphismColors.darkShadow,
          shadowOffset: { width: distance / 2, height: distance / 2 },
          shadowOpacity: 0.2,
          shadowRadius: blur / 2,
          elevation: 2,
        };

      case 'flat':
      default:
        // Subtle flat look
        return {
          ...baseStyle,
          shadowColor: NeumorphismColors.darkShadow,
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        };
    }
  } catch (error) {
    console.warn('Error in createNeumorphismStyle:', error);
    return { 
      backgroundColor: color || NeumorphismColors.surface, 
      borderRadius: 12,
      padding: 16 
    };
  }
};

// Platform detection
import { Platform } from 'react-native';

// Neumorphism utility functions
export const NeumorphismUtils = {
  // Create multiple shadows for better neumorphism effect
  createDualShadow: (size: NeumorphismSize = 'medium') => {
    const shadowConfig: Record<NeumorphismSize, { distance: number; blur: number }> = {
      small: { distance: 4, blur: 8 },
      medium: { distance: 8, blur: 16 },
      large: { distance: 12, blur: 24 },
    };
    const config = shadowConfig[size] || shadowConfig.medium;
    const { distance, blur } = config;

    return {
      // Dark shadow (bottom-right)
      shadowColor: NeumorphismColors.darkShadow,
      shadowOffset: { width: distance, height: distance },
      shadowOpacity: 0.3,
      shadowRadius: blur,
      elevation: 8,
    };
  },

  // Create inset shadow effect
  createInsetShadow: (size: NeumorphismSize = 'medium') => ({
    backgroundColor: NeumorphismColors.dark,
    borderWidth: 1,
    borderColor: NeumorphismColors.darkShadow,
  }),

  // Create floating/elevated effect
  createFloatingShadow: (size: NeumorphismSize = 'medium') => {
    const shadowDistance = size === 'small' ? 6 : size === 'large' ? 16 : 12;
    
    return {
      shadowColor: NeumorphismColors.darkShadow,
      shadowOffset: { width: 0, height: shadowDistance },
      shadowOpacity: 0.25,
      shadowRadius: shadowDistance * 2,
      elevation: shadowDistance,
    };
  },
};

// Preset neumorphism styles for common components
export const NeumorphismPresets = {
  card: createNeumorphismStyle('convex', 'medium'),
  button: createNeumorphismStyle('convex', 'small'),
  input: createNeumorphismStyle('concave', 'medium'),
  fab: {
    ...createNeumorphismStyle('convex', 'large'),
    ...NeumorphismUtils.createFloatingShadow('large'),
  },
  header: createNeumorphismStyle('flat', 'small'),
  modal: createNeumorphismStyle('convex', 'large'),
};