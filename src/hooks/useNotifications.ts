import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NotificationService, PushNotificationData } from '../services/notifications';

interface UseNotificationsReturn {
  isInitialized: boolean;
  pushToken: string | null;
  permissionStatus: Notifications.PermissionStatus | null;
  sendNotification: (userId: string, notification: Omit<PushNotificationData, 'userId'>) => Promise<boolean>;
  scheduleReminder: (habitName: string, habitId: string, trigger: Notifications.NotificationTriggerInput) => Promise<string | null>;
  clearAllNotifications: () => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);

  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    initializeNotifications();
    setupAppStateListener();

    return () => {
      notificationService.cleanup();
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      // Check permissions first
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);

      // Initialize service if permissions granted
      if (status === 'granted') {
        const success = await notificationService.initialize();
        if (success) {
          setIsInitialized(true);
          setPushToken(notificationService.getPushToken());
        }
      } else {
        console.log('Notification permissions not granted');
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  const setupAppStateListener = () => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Clear badge when app becomes active
        notificationService.setBadgeCount(0);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  };

  const sendNotification = async (
    userId: string, 
    notification: Omit<PushNotificationData, 'userId'>
  ): Promise<boolean> => {
    if (!isInitialized) {
      console.warn('Notification service not initialized');
      return false;
    }

    return await notificationService.sendNotificationToUser(userId, notification);
  };

  const scheduleReminder = async (
    habitName: string,
    habitId: string,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string | null> => {
    if (!isInitialized) {
      console.warn('Notification service not initialized');
      return null;
    }

    const content: Notifications.NotificationContentInput = {
      title: 'Habit Reminder',
      body: `Don't forget to complete "${habitName}" today!`,
      data: { habitId, type: 'habit_reminder' },
      sound: 'default',
    };

    return await notificationService.scheduleLocalNotification(trigger, content);
  };

  const clearAllNotifications = async (): Promise<void> => {
    await notificationService.clearAllNotifications();
  };

  const setBadgeCount = async (count: number): Promise<void> => {
    await notificationService.setBadgeCount(count);
  };

  return {
    isInitialized,
    pushToken,
    permissionStatus,
    sendNotification,
    scheduleReminder,
    clearAllNotifications,
    setBadgeCount,
  };
};

// Hook for managing habit reminders
export const useHabitReminders = () => {
  const { scheduleReminder, isInitialized } = useNotifications();
  const [scheduledReminders, setScheduledReminders] = useState<Record<string, string>>({});

  const scheduleHabitReminder = async (
    habitId: string,
    habitName: string,
    reminderTime: { hour: number; minute: number },
    repeatDaily: boolean = true
  ): Promise<boolean> => {
    if (!isInitialized) return false;

    try {
      // Cancel existing reminder if any
      await cancelHabitReminder(habitId);

      const trigger: Notifications.NotificationTriggerInput = repeatDaily
        ? {
            type: 'daily',
            hour: reminderTime.hour,
            minute: reminderTime.minute,
            repeats: true,
          } as Notifications.DailyTriggerInput
        : {
            date: new Date(
              Date.now() + 
              (reminderTime.hour * 60 + reminderTime.minute) * 60 * 1000
            ),
          } as Notifications.DateTriggerInput;

      const notificationId = await scheduleReminder(habitName, habitId, trigger);
      
      if (notificationId) {
        setScheduledReminders(prev => ({
          ...prev,
          [habitId]: notificationId,
        }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to schedule habit reminder:', error);
      return false;
    }
  };

  const cancelHabitReminder = async (habitId: string): Promise<void> => {
    const notificationId = scheduledReminders[habitId];
    if (notificationId) {
      await NotificationService.getInstance().cancelScheduledNotification(notificationId);
      setScheduledReminders(prev => {
        const updated = { ...prev };
        delete updated[habitId];
        return updated;
      });
    }
  };

  const cancelAllHabitReminders = async (): Promise<void> => {
    const promises = Object.keys(scheduledReminders).map(cancelHabitReminder);
    await Promise.all(promises);
  };

  return {
    scheduleHabitReminder,
    cancelHabitReminder,
    cancelAllHabitReminders,
    scheduledReminders,
  };
};

// Hook for social notifications
export const useSocialNotifications = () => {
  const { sendNotification, isInitialized } = useNotifications();

  const sendFriendRequestNotification = async (
    toUserId: string,
    fromUserName: string,
    fromUserId: string
  ): Promise<boolean> => {
    if (!isInitialized) return false;

    return await sendNotification(toUserId, {
      type: 'friend_request',
      title: 'New Friend Request',
      body: `${fromUserName} wants to be your friend!`,
      data: { fromUserId },
      priority: 'normal',
    });
  };

  const sendFriendAcceptedNotification = async (
    toUserId: string,
    userName: string
  ): Promise<boolean> => {
    if (!isInitialized) return false;

    return await sendNotification(toUserId, {
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      body: `${userName} accepted your friend request!`,
      data: { userId: toUserId },
      priority: 'normal',
    });
  };

  const sendChallengeInviteNotification = async (
    toUserId: string,
    challengeName: string,
    challengeId: string,
    fromUserName: string
  ): Promise<boolean> => {
    if (!isInitialized) return false;

    return await sendNotification(toUserId, {
      type: 'challenge_invite',
      title: 'Challenge Invitation',
      body: `${fromUserName} invited you to join "${challengeName}"`,
      data: { challengeId },
      priority: 'high',
    });
  };

  const sendBadgeEarnedNotification = async (
    userId: string,
    badgeName: string,
    badgeId: string
  ): Promise<boolean> => {
    if (!isInitialized) return false;

    return await sendNotification(userId, {
      type: 'badge_earned',
      title: 'New Badge Earned! 🏆',
      body: `Congratulations! You earned the "${badgeName}" badge!`,
      data: { badgeId },
      priority: 'high',
    });
  };

  return {
    sendFriendRequestNotification,
    sendFriendAcceptedNotification,
    sendChallengeInviteNotification,
    sendBadgeEarnedNotification,
  };
};