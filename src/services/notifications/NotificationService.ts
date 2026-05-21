import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../constants/api';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface PushNotificationData {
  type: 'friend_request' | 'friend_accepted' | 'challenge_invite' | 'challenge_update' | 'badge_earned' | 'habit_reminder';
  title: string;
  body: string;
  data?: Record<string, any>;
  userId: string;
  priority?: 'low' | 'normal' | 'high';
  sound?: string;
  badge?: number;
}

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<boolean> {
    try {
      // Register for push notifications
      const token = await this.registerForPushNotifications();
      if (!token) return false;

      this.expoPushToken = token;

      // Save token to user profile
      await this.saveTokenToProfile(token);

      // Set up notification listeners
      this.setupNotificationListeners();

      console.log('✅ Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get Expo push token
   */
  private async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permissions not granted');
      return null;
    }

    // Get Expo push token
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.warn('Project ID not found. Push notifications may not work.');
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('📱 Expo Push Token:', tokenData.data);
      return tokenData.data;
    } catch (error) {
      console.error('Failed to get Expo push token:', error);
      return null;
    }
  }

  /**
   * Save push token to user profile in Supabase
   */
  private async saveTokenToProfile(token: string): Promise<void> {
    try {
      await apiClient.post('/users/push-token', { 
        pushToken: token,
        platform: Platform.OS,
        deviceId: Device.osInternalBuildId || 'unknown',
        updatedAt: new Date().toISOString()
      });


      console.log('✅ Push token saved to backend');
    } catch (error) {
      console.error('❌ Failed to save push token:', error);
    }
  }

  /**
   * Set up notification event listeners
   */
  private setupNotificationListeners(): void {
    // Listen for notifications received while app is running
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listen for user interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle notification received while app is running
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const { request } = notification;
    const data = request.content.data as any;

    // You can show in-app notifications, update UI, etc.
    console.log('Notification data:', data);
  }

  /**
   * Handle user tapping on notification
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data as any;
    
    // Navigate based on notification type
    this.handleNotificationNavigation(data);
  }

  /**
   * Handle navigation based on notification data
   */
  private handleNotificationNavigation(data: any): void {
    const { type, challengeId, userId, habitId } = data;

    // This would integrate with your navigation service
    switch (type) {
      case 'friend_request':
        // Navigate to friends screen
        console.log('Navigate to friends screen');
        break;
      
      case 'challenge_invite':
      case 'challenge_update':
        if (challengeId) {
          // Navigate to challenge details
          console.log('Navigate to challenge:', challengeId);
        }
        break;
      
      case 'badge_earned':
        // Navigate to profile/badges screen
        console.log('Navigate to badges screen');
        break;
      
      case 'habit_reminder':
        if (habitId) {
          // Navigate to habit details
          console.log('Navigate to habit:', habitId);
        }
        break;
    }
  }

  /**
   * Send notification to specific user
   */
  async sendNotificationToUser(
    userId: string,
    notification: Omit<PushNotificationData, 'userId'>
  ): Promise<boolean> {
    try {
      // Send notification via backend API
      await apiClient.post('/notifications/send', {
        recipientUserId: userId,
        title: notification.title,
        body: notification.body,
        data: notification.data,
      });

      return true;
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendNotificationToUsers(
    userIds: string[],
    notification: Omit<PushNotificationData, 'userId'>
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendNotificationToUser(userId, notification))
    );

    const success = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - success;

    console.log(`📊 Notification results: ${success} sent, ${failed} failed`);
    
    return { success, failed };
  }

  /**
   * Schedule local notification
   */
  async scheduleLocalNotification(
    trigger: Notifications.NotificationTriggerInput,
    content: Notifications.NotificationContentInput
  ): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });

      console.log('⏰ Local notification scheduled:', identifier);
      return identifier;
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelScheduledNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log('🚫 Notification cancelled:', identifier);
    } catch (error) {
      console.error('❌ Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🚫 All notifications cancelled');
    } catch (error) {
      console.error('❌ Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('❌ Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('❌ Failed to set badge count:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await this.setBadgeCount(0);
      console.log('🧹 All notifications cleared');
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
    }
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }
}

// Convenience functions for common notification types
export const NotificationTemplates = {
  friendRequest: (fromUserName: string, fromUserId: string): Omit<PushNotificationData, 'userId'> => ({
    type: 'friend_request',
    title: 'New Friend Request',
    body: `${fromUserName} wants to be your friend!`,
    data: { fromUserId },
    priority: 'normal',
  }),

  friendAccepted: (userName: string, userId: string): Omit<PushNotificationData, 'userId'> => ({
    type: 'friend_accepted',
    title: 'Friend Request Accepted',
    body: `${userName} accepted your friend request!`,
    data: { userId },
    priority: 'normal',
  }),

  challengeInvite: (challengeName: string, challengeId: string, fromUserName: string): Omit<PushNotificationData, 'userId'> => ({
    type: 'challenge_invite',
    title: 'Challenge Invitation',
    body: `${fromUserName} invited you to join "${challengeName}"`,
    data: { challengeId },
    priority: 'high',
  }),

  challengeUpdate: (challengeName: string, challengeId: string, message: string): Omit<PushNotificationData, 'userId'> => ({
    type: 'challenge_update',
    title: challengeName,
    body: message,
    data: { challengeId },
    priority: 'normal',
  }),

  badgeEarned: (badgeName: string, badgeId: string): Omit<PushNotificationData, 'userId'> => ({
    type: 'badge_earned',
    title: 'New Badge Earned! 🏆',
    body: `Congratulations! You earned the "${badgeName}" badge!`,
    data: { badgeId },
    priority: 'high',
  }),

  habitReminder: (habitName: string, habitId: string): Omit<PushNotificationData, 'userId'> => ({
    type: 'habit_reminder',
    title: 'Habit Reminder',
    body: `Don't forget to complete "${habitName}" today!`,
    data: { habitId },
    priority: 'normal',
  }),
};

export default NotificationService;