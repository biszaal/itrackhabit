import { useEffect, useState, useCallback } from 'react';
import { SmartNotificationService, NotificationPreferences } from '../services/notifications';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

interface UseSmartNotificationsReturn {
  isInitialized: boolean;
  preferences: NotificationPreferences | null;
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
  scheduleHabitNotifications: (habit: any) => Promise<void>;
  onHabitCompleted: (habitId: string) => Promise<void>;
  recordActivity: (habitId: string, action: 'completed' | 'opened_app' | 'viewed_habit') => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export const useSmartNotifications = (): UseSmartNotificationsReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const { isAuthenticated } = useAuth();
  
  const smartNotificationService = SmartNotificationService.getInstance();

  const initializeService = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      await smartNotificationService.initialize();
      const userPreferences = await smartNotificationService.loadUserPreferences();
      setPreferences(userPreferences);
      setIsInitialized(true);
      console.log('🧠 Smart notifications initialized');
    } catch (error) {
      console.error('❌ Failed to initialize smart notifications:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    initializeService();
  }, [initializeService]);

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isInitialized) {
        recordActivity('app', 'opened_app');
      }
    }, [isInitialized])
  );

  const updatePreferences = useCallback(async (newPreferences: NotificationPreferences): Promise<void> => {
    try {
      await smartNotificationService.savePreferences(newPreferences);
      setPreferences(newPreferences);
      console.log('✅ Notification preferences updated');
    } catch (error) {
      console.error('❌ Failed to update preferences:', error);
      throw error;
    }
  }, []);

  const scheduleHabitNotifications = useCallback(async (habit: any): Promise<void> => {
    if (!isInitialized) return;
    
    try {
      await smartNotificationService.scheduleHabitNotifications(habit);
      console.log(`📅 Scheduled smart notifications for ${habit.title}`);
    } catch (error) {
      console.error(`❌ Failed to schedule notifications for ${habit.title}:`, error);
    }
  }, [isInitialized]);

  const onHabitCompleted = useCallback(async (habitId: string): Promise<void> => {
    if (!isInitialized) return;
    
    try {
      await smartNotificationService.onHabitCompleted(habitId);
      console.log(`✅ Processed habit completion for ${habitId}`);
    } catch (error) {
      console.error(`❌ Failed to process habit completion:`, error);
    }
  }, [isInitialized]);

  const recordActivity = useCallback(async (
    habitId: string, 
    action: 'completed' | 'opened_app' | 'viewed_habit'
  ): Promise<void> => {
    if (!isInitialized) return;
    
    try {
      await smartNotificationService.recordUserActivity(habitId, action);
    } catch (error) {
      console.error('❌ Failed to record activity:', error);
    }
  }, [isInitialized]);

  const refreshNotifications = useCallback(async (): Promise<void> => {
    if (!isInitialized) return;
    
    try {
      await smartNotificationService.scheduleAllHabitNotifications();
      console.log('🔄 Refreshed all smart notifications');
    } catch (error) {
      console.error('❌ Failed to refresh notifications:', error);
    }
  }, [isInitialized]);

  return {
    isInitialized,
    preferences,
    updatePreferences,
    scheduleHabitNotifications,
    onHabitCompleted,
    recordActivity,
    refreshNotifications,
  };
};

// Hook for notification settings screen
export const useNotificationSettings = () => {
  const { preferences, updatePreferences, isInitialized } = useSmartNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const toggleEnabled = useCallback(async (enabled: boolean) => {
    if (!preferences) return;
    
    setIsLoading(true);
    try {
      await updatePreferences({ ...preferences, enabled });
    } finally {
      setIsLoading(false);
    }
  }, [preferences, updatePreferences]);

  const toggleHabitReminders = useCallback(async (habitReminders: boolean) => {
    if (!preferences) return;
    
    setIsLoading(true);
    try {
      await updatePreferences({ ...preferences, habitReminders });
    } finally {
      setIsLoading(false);
    }
  }, [preferences, updatePreferences]);

  const toggleStreakProtection = useCallback(async (streakProtection: boolean) => {
    if (!preferences) return;
    
    setIsLoading(true);
    try {
      await updatePreferences({ ...preferences, streakProtection });
    } finally {
      setIsLoading(false);
    }
  }, [preferences, updatePreferences]);

  const toggleMotivationalMessages = useCallback(async (motivationalMessages: boolean) => {
    if (!preferences) return;
    
    setIsLoading(true);
    try {
      await updatePreferences({ ...preferences, motivationalMessages });
    } finally {
      setIsLoading(false);
    }
  }, [preferences, updatePreferences]);

  const updateQuietHours = useCallback(async (quietHours: { enabled: boolean; start: string; end: string }) => {
    if (!preferences) return;
    
    setIsLoading(true);
    try {
      await updatePreferences({ ...preferences, quietHours });
    } finally {
      setIsLoading(false);
    }
  }, [preferences, updatePreferences]);

  const updateFrequency = useCallback(async (frequency: 'minimal' | 'balanced' | 'frequent') => {
    if (!preferences) return;
    
    setIsLoading(true);
    try {
      await updatePreferences({ ...preferences, frequency });
    } finally {
      setIsLoading(false);
    }
  }, [preferences, updatePreferences]);

  return {
    preferences,
    isLoading,
    isInitialized,
    toggleEnabled,
    toggleHabitReminders,
    toggleStreakProtection,
    toggleMotivationalMessages,
    updateQuietHours,
    updateFrequency,
  };
};

export default useSmartNotifications;