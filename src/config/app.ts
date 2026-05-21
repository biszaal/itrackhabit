// App Configuration
export const AppConfig = {
  app: {
    name: 'iTrackHabit',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.itrackhabit.com',
    timeout: 10000,
    retryAttempts: 3,
  },
  
  auth: {
    sessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days
    refreshTokenThreshold: 5 * 60 * 1000, // 5 minutes
  },
  
  storage: {
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  
  features: {
    offlineMode: true,
    pushNotifications: true,
    healthIntegration: true,
    socialFeatures: true,
    challenges: true,
  },
  
  ui: {
    animationDuration: 300,
    defaultPageSize: 20,
    maxRetryAttempts: 3,
  },
  
  habits: {
    maxHabitsPerUser: 50,
    defaultReminderTime: '09:00',
    maxStreakDisplay: 999,
  },
  
  premium: {
    trialDays: 7,
    maxFreeHabits: 5,
    features: ['unlimited_habits', 'custom_themes', 'advanced_analytics', 'priority_support'],
  },
} as const;

export type AppConfig = typeof AppConfig;