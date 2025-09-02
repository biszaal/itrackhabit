// Modern Animation-Focused Theme Configuration
// Inspired by Reactiive.io's vibrant and fluid design philosophy
export const theme = {
  colors: {
    // Primary colors - Beautiful blue tones
    primary: '#667eea', // Neumorphism primary blue
    primaryLight: '#DBEAFE', // Ultra-light blue background
    primaryDark: '#1E40AF', // Deep blue for contrast
    primarySoft: '#93C5FD', // Soft blue for subtle elements
    primaryGradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)', // Blue gradient
    
    // Accent colors - Electric and modern
    accent: '#06B6D4', // Electric cyan - great for highlights
    accentLight: '#ECFEFF', // Very light cyan
    accentSoft: '#67E8F9', // Bright cyan for interactive elements
    accentGradient: 'linear-gradient(135deg, #06B6D4 0%, #0EA5E9 100%)',
    
    // Secondary accent - For variety in animations
    secondary: '#F59E0B', // Vibrant amber
    secondaryLight: '#FEF3C7',
    secondaryGradient: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
    
    // Background system - Neumorphism colors
    background: '#E0E5EC', // Neumorphism background
    backgroundSecondary: '#F0F5FC', // Light variant
    backgroundTertiary: '#D1D9E6', // Dark variant
    surface: '#E0E5EC', // Neumorphism surface
    surfaceElevated: '#E0E5EC', // Elevated surface
    surfaceOverlay: 'rgba(224, 229, 236, 0.95)', // Neumorphism overlay
    
    // Text hierarchy - Optimized for neumorphism
    text: '#2D3748', // Dark text for neumorphism
    textSecondary: '#4A5568', // Medium dark text
    textTertiary: '#718096', // Medium gray text
    textMuted: '#A0AEC0', // Muted text
    textDisabled: '#CBD5E0', // Disabled text
    
    // Pure white for glass elements and special cases
    white: '#FFFFFF', // Pure white
    
    // Borders and dividers - Modern and subtle
    border: '#E4E4E7', // Light zinc border
    borderSoft: '#F4F4F5', // Ultra-subtle border
    borderAccent: '#C7D2FE', // Accent border for highlights
    divider: '#F4F4F5', // Minimal divider
    
    // Interactive states - Vibrant and responsive
    interactive: '#6366F1', // Primary indigo for buttons
    interactiveHover: '#5B5FE8', // Lighter hover state
    interactivePressed: '#4338CA', // Pressed state
    interactiveDisabled: '#D4D4D8', // Disabled state
    
    // Status colors - Modern and vibrant
    success: '#10B981', // Emerald green
    successLight: '#D1FAE5',
    successSoft: '#6EE7B7',
    successGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    
    warning: '#F59E0B', // Amber
    warningLight: '#FEF3C7',
    warningMuted: '#FBBF24',
    warningSoft: '#FCD34D',
    warningGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    
    error: '#EF4444', // Red
    errorLight: '#FEE2E2',
    errorSoft: '#FCA5A5',
    errorGradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    
    info: '#3B82F6', // Blue
    infoLight: '#DBEAFE',
    infoSoft: '#93C5FD',
    infoGradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    
    // Category colors - Vibrant and modern
    categoryBlue: '#60A5FA', // Bright blue
    categoryRed: '#F87171', // Bright red
    categoryOrange: '#FB923C', // Bright orange
    categoryGreen: '#34D399', // Bright green
    categoryPurple: '#A78BFA', // Bright purple
    categoryPink: '#F472B6', // Bright pink
    categoryYellow: '#FBBF24', // Bright yellow
    categoryTeal: '#2DD4BF', // Bright teal
    categoryIndigo: '#818CF8', // Bright indigo
    
    // Neumorphism shadows and overlays
    lightShadow: '#FFFFFF',
    darkShadow: '#A3B1C6',
    overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlays
    overlayLight: 'rgba(0, 0, 0, 0.3)', // Light overlay
    backdrop: 'rgba(0, 0, 0, 0.8)', // Backdrop filter
    
    // Animation-specific colors
    shimmer: '#F1F5F9', // Shimmer effect
    shimmerHighlight: '#FFFFFF',
    particle: '#C7D2FE', // Particle effects
    glow: '#6366F1', // Glow effects
    
    // Deprecated - keeping for backward compatibility
    whiteDeprecated: '#FFFFFF',
    blue: '#7DD3FC',
    orange: '#FDBA74',
    purple: '#C4B5FD',
    green: '#86EFAC',
    pink: '#F9A8D4',
    indigo: '#A5B4FC',
    teal: '#5EEAD4',
    yellow: '#FDE047',
    lightGreen: '#10B981',
    lightRed: '#EF4444',
    lightOrange: '#FB923C',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16, // Standard spacing
    xl: 24, // Larger spacing
    xxl: 32, // Extra large
    xxxl: 48, // Ultra large for hero sections
    section: 20, // Section padding
    card: 16, // Card padding
    button: 12, // Button padding
  },
  
  borderRadius: {
    none: 0,
    xs: 2,
    sm: 6, // Slightly rounded
    md: 8, // Standard rounding
    lg: 12, // More rounded
    xl: 16, // Very rounded
    xxl: 20, // Extra rounded for cards
    full: 9999,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16, // Base size
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    title: 32,
    hero: 40, // Hero text
    display: 48, // Display text
  },
  
  fontWeight: {
    thin: '100' as const,
    extralight: '200' as const,
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  
  // Animation values - simplified
  animation: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 350,
      slower: 500,
      slowest: 750,
    },
    scale: {
      press: 0.95,
      hover: 1.05,
      pop: 1.1,
    },
    spring: {
      default: {
        damping: 15,
        stiffness: 150,
      },
      bouncy: {
        damping: 10,
        stiffness: 100,
      },
      gentle: {
        damping: 20,
        stiffness: 200,
      },
    },
  },
  
  // Hermes-compatible shadow system (simplified)
  shadows: {
    none: {},
    subtle: {},
    sm: {},
    md: {},
    lg: {},
    xl: {},
    button: {},
    card: {},
    floating: {},
  },
  
  // Neumorphism effects
  neumorphism: {
    background: '#E0E5EC',
    surface: '#E0E5EC',
    lightShadow: '#FFFFFF',
    darkShadow: '#A3B1C6',
  },
} as const;

export type Theme = typeof theme;