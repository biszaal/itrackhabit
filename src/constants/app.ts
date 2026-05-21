/**
 * Application Constants
 * Centralized constants used throughout the application
 */

export const APP_CONFIG = {
  NAME: 'iTrackHabit',
  VERSION: '1.0.0',
  DESCRIPTION: 'Track your habits and build better routines',
} as const;

export const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_DATA: 'user_data',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  NOTIFICATION_SETTINGS: 'notification_settings',
  PREMIUM_STATUS: 'premium_status',
  TIMER_STATE: 'timer_state',
  OFFLINE_QUEUE: 'offline_queue',
} as const;

export const API_ENDPOINTS = {
  AUTH: '/auth',
  HABITS: '/habits',
  PROGRESS: '/progress',
  CHALLENGES: '/challenges',
  FRIENDS: '/friends',
  ACHIEVEMENTS: '/achievements',
  INSIGHTS: '/insights',
  HEALTH: '/health',
} as const;

export const HABIT_TYPES = {
  HEALTH: 'health',
  PRODUCTIVITY: 'productivity',
  LEARNING: 'learning',
  WELLNESS: 'wellness',
  SOCIAL: 'social',
  CREATIVE: 'creative',
} as const;

export const HABIT_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly', 
  CUSTOM: 'custom',
} as const;

// Legacy export for compatibility
export const AppConfig = APP_CONFIG;