// Ultra-minimal theme to avoid Hermes engine issues
export const minimalTheme = {
  colors: {
    primary: '#6366F1',
    primaryLight: '#EEF2FF',
    accent: '#06B6D4',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#18181B',
    textSecondary: '#52525B',
    textMuted: '#A1A1AA',
    textTertiary: '#71717A',
    
    border: '#E4E4E7',
    borderSoft: '#F4F4F5',
    white: '#FFFFFF',
    
    // Additional colors needed by screens
    lightGreen: '#10B981',
    lightOrange: '#FED7AA',
    lightRed: '#FEE2E2',
    interactive: '#6366F1',
    warningLight: '#FEF3C7',
    warningMuted: '#F59E0B',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    full: 9999,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    title: 28,
  },
  
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export type MinimalTheme = typeof minimalTheme;