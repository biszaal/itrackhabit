import { NotificationService, NotificationTemplates } from './NotificationService';
import { dataService } from '../core';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toLocalISODate } from '../../utils/formatting/time';

export interface NotificationPreferences {
  enabled: boolean;
  habitReminders: boolean;
  streakProtection: boolean;
  motivationalMessages: boolean;
  optimalTiming: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "07:00"
  };
  frequency: 'minimal' | 'balanced' | 'frequent';
}

export interface HabitNotificationContext {
  habitId: string;
  habitName: string;
  lastCompleted?: string;
  currentStreak: number;
  completionRate: number;
  targetTime?: string; // "09:00"
  isTimeBased: boolean;
  userActiveHours?: number[]; // [9, 10, 11, 18, 19, 20] - hours user is most active
}

export interface SmartNotificationData {
  type: 'habit_reminder' | 'streak_protection' | 'motivation' | 'recovery' | 'achievement';
  habitId?: string;
  title: string;
  body: string;
  scheduledFor: Date;
  priority: 'low' | 'normal' | 'high';
  context?: Record<string, any>;
}

export class SmartNotificationService {
  private static instance: SmartNotificationService;
  private notificationService: NotificationService;
  private readonly STORAGE_KEY = 'smart_notification_preferences';
  private readonly USER_ACTIVITY_KEY = 'user_activity_patterns';
  private scheduledNotifications: Map<string, string> = new Map();

  private constructor() {
    this.notificationService = NotificationService.getInstance();
  }

  static getInstance(): SmartNotificationService {
    if (!SmartNotificationService.instance) {
      SmartNotificationService.instance = new SmartNotificationService();
    }
    return SmartNotificationService.instance;
  }

  /**
   * Initialize smart notifications with user preferences
   */
  async initialize(): Promise<void> {
    try {
      await this.notificationService.initialize();
      await this.loadUserPreferences();
      await this.scheduleAllHabitNotifications();
      console.log('🧠 Smart Notification Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize smart notifications:', error);
    }
  }

  /**
   * Get default notification preferences
   */
  getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      habitReminders: true,
      streakProtection: true,
      motivationalMessages: true,
      optimalTiming: true,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '07:00',
      },
      frequency: 'balanced',
    };
  }

  /**
   * Save user notification preferences
   */
  async savePreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
      // Reschedule notifications with new preferences
      await this.scheduleAllHabitNotifications();
    } catch (error) {
      console.error('❌ Failed to save notification preferences:', error);
    }
  }

  /**
   * Load user notification preferences
   */
  async loadUserPreferences(): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultPreferences();
    } catch (error) {
      console.error('❌ Failed to load notification preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Track user activity to learn optimal notification times
   */
  async recordUserActivity(habitId: string, action: 'completed' | 'opened_app' | 'viewed_habit'): Promise<void> {
    try {
      const now = new Date();
      const hour = now.getHours();
      const activityData = await this.getUserActivityPatterns();
      
      if (!activityData[habitId]) {
        activityData[habitId] = { hourlyActivity: {}, totalActions: 0 };
      }

      if (!activityData[habitId].hourlyActivity[hour]) {
        activityData[habitId].hourlyActivity[hour] = 0;
      }

      activityData[habitId].hourlyActivity[hour]++;
      activityData[habitId].totalActions++;

      await AsyncStorage.setItem(this.USER_ACTIVITY_KEY, JSON.stringify(activityData));
    } catch (error) {
      console.error('❌ Failed to record user activity:', error);
    }
  }

  /**
   * Get user activity patterns
   */
  private async getUserActivityPatterns(): Promise<Record<string, { hourlyActivity: Record<number, number>; totalActions: number }>> {
    try {
      const stored = await AsyncStorage.getItem(this.USER_ACTIVITY_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('❌ Failed to load user activity patterns:', error);
      return {};
    }
  }

  /**
   * Calculate optimal notification time for a habit
   */
  private async calculateOptimalTime(habitId: string, preferredTime?: string): Promise<Date> {
    const preferences = await this.loadUserPreferences();
    const now = new Date();
    
    // If optimal timing is disabled, use preferred time or default
    if (!preferences.optimalTiming) {
      return this.parseTimeString(preferredTime || '09:00');
    }

    // Get user activity patterns for this habit
    const activityData = await this.getUserActivityPatterns();
    const habitActivity = activityData[habitId];

    if (habitActivity && habitActivity.totalActions > 5) {
      // Find the hour with highest activity
      const hourlyActivity = habitActivity.hourlyActivity;
      const mostActiveHour = Object.keys(hourlyActivity).reduce((a, b) => 
        hourlyActivity[parseInt(a)] > hourlyActivity[parseInt(b)] ? a : b
      );

      const optimalTime = new Date();
      optimalTime.setHours(parseInt(mostActiveHour), 0, 0, 0);
      
      // Make sure it's not in quiet hours
      if (this.isInQuietHours(optimalTime, preferences.quietHours)) {
        return this.parseTimeString(preferredTime || '09:00');
      }

      return optimalTime;
    }

    // Fallback to preferred time or smart default based on habit type
    return this.parseTimeString(preferredTime || this.getSmartDefaultTime(habitId));
  }

  /**
   * Get smart default time based on habit name/type
   */
  private getSmartDefaultTime(habitId: string): string {
    // This could be enhanced to analyze habit names for better defaults
    // For now, return morning time as default
    return '09:00';
  }

  /**
   * Parse time string to Date object
   */
  private parseTimeString(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Check if time is in quiet hours
   */
  private isInQuietHours(date: Date, quietHours: { enabled: boolean; start: string; end: string }): boolean {
    if (!quietHours.enabled) return false;

    const hour = date.getHours();
    const startHour = parseInt(quietHours.start.split(':')[0]);
    const endHour = parseInt(quietHours.end.split(':')[0]);

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startHour > endHour) {
      return hour >= startHour || hour < endHour;
    }

    return hour >= startHour && hour < endHour;
  }

  /**
   * Schedule all habit notifications intelligently
   */
  async scheduleAllHabitNotifications(): Promise<void> {
    try {
      const preferences = await this.loadUserPreferences();
      if (!preferences.enabled || !preferences.habitReminders) return;

      // Clear existing scheduled notifications
      await this.clearAllScheduledNotifications();

      // Get all habits
      const habits = await dataService.getHabits();
      
      for (const habit of habits) {
        await this.scheduleHabitNotifications(habit);
      }

      console.log(`📅 Scheduled smart notifications for ${habits.length} habits`);
    } catch (error) {
      console.error('❌ Failed to schedule habit notifications:', error);
    }
  }

  /**
   * Schedule smart notifications for a specific habit
   */
  async scheduleHabitNotifications(habit: any): Promise<void> {
    const preferences = await this.loadUserPreferences();
    const today = toLocalISODate();
    
    try {
      // Get habit progress for context
      const progress = await dataService.getHabitProgressForDate(habit.id, today);
      const context: HabitNotificationContext = {
        habitId: habit.id,
        habitName: habit.title,
        lastCompleted: progress?.date,
        currentStreak: 0, // This would come from habit stats
        completionRate: 0, // This would come from habit stats  
        isTimeBased: habit.targetConfig?.isTimeBased || false,
        targetTime: habit.reminderTime,
      };

      // 1. Regular habit reminder (if not completed today)
      if (!progress || progress.status !== 'done') {
        await this.scheduleHabitReminder(context, preferences);
      }

      // 2. Streak protection (if enabled)
      if (preferences.streakProtection && context.currentStreak > 0) {
        await this.scheduleStreakProtectionNotification(context, preferences);
      }

      // 3. Motivational messages (based on frequency setting)
      if (preferences.motivationalMessages) {
        await this.scheduleMotivationalNotification(context, preferences);
      }

    } catch (error) {
      console.error(`❌ Failed to schedule notifications for habit ${habit.title}:`, error);
    }
  }

  /**
   * Schedule regular habit reminder
   */
  private async scheduleHabitReminder(
    context: HabitNotificationContext, 
    preferences: NotificationPreferences
  ): Promise<void> {
    const optimalTime = await this.calculateOptimalTime(context.habitId, context.targetTime);
    
    // Don't schedule if time has already passed today
    if (optimalTime < new Date()) {
      optimalTime.setDate(optimalTime.getDate() + 1);
    }

    const content: Notifications.NotificationContentInput = {
      title: this.generateReminderTitle(context),
      body: this.generateReminderBody(context),
      data: { 
        type: 'habit_reminder', 
        habitId: context.habitId,
        notificationType: 'smart_reminder'
      },
    };

    const trigger: Notifications.NotificationTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DATE as any,
      date: optimalTime,
      repeats: true,
    } as unknown as Notifications.DateTriggerInput;

    const notificationId = await this.notificationService.scheduleLocalNotification(trigger, content);
    if (notificationId) {
      this.scheduledNotifications.set(`reminder_${context.habitId}`, notificationId);
    }
  }

  /**
   * Schedule streak protection notification
   */
  private async scheduleStreakProtectionNotification(
    context: HabitNotificationContext,
    preferences: NotificationPreferences
  ): Promise<void> {
    // Schedule for evening if habit not completed
    const eveningTime = new Date();
    eveningTime.setHours(20, 0, 0, 0); // 8 PM
    
    if (eveningTime < new Date()) {
      eveningTime.setDate(eveningTime.getDate() + 1);
    }

    const content: Notifications.NotificationContentInput = {
      title: `🔥 Your ${context.currentStreak}-day streak needs you!`,
      body: `Don't let your amazing ${context.habitName} streak end today. You've got this!`,
      data: { 
        type: 'streak_protection', 
        habitId: context.habitId,
        streak: context.currentStreak,
      },
    };

    const trigger: Notifications.NotificationTriggerInput = {
      date: eveningTime,
    } as Notifications.DateTriggerInput;

    const notificationId = await this.notificationService.scheduleLocalNotification(trigger, content);
    if (notificationId) {
      this.scheduledNotifications.set(`streak_${context.habitId}`, notificationId);
    }
  }

  /**
   * Schedule motivational notification
   */
  private async scheduleMotivationalNotification(
    context: HabitNotificationContext,
    preferences: NotificationPreferences
  ): Promise<void> {
    // Skip if frequency is minimal
    if (preferences.frequency === 'minimal') return;

    // Schedule motivational message based on completion rate
    const motivationTime = new Date();
    motivationTime.setHours(12, 0, 0, 0); // Noon

    if (motivationTime < new Date()) {
      motivationTime.setDate(motivationTime.getDate() + 1);
    }

    const content: Notifications.NotificationContentInput = {
      title: this.generateMotivationalTitle(context),
      body: this.generateMotivationalBody(context),
      data: { 
        type: 'motivation', 
        habitId: context.habitId,
      },
    };

    // Only schedule occasionally based on frequency setting
    const shouldSchedule = preferences.frequency === 'frequent' || Math.random() > 0.7;
    
    if (shouldSchedule) {
      const trigger: Notifications.NotificationTriggerInput = {
        date: motivationTime,
      } as Notifications.DateTriggerInput;

      const notificationId = await this.notificationService.scheduleLocalNotification(trigger, content);
      if (notificationId) {
        this.scheduledNotifications.set(`motivation_${context.habitId}`, notificationId);
      }
    }
  }

  /**
   * Generate context-aware reminder titles
   */
  private generateReminderTitle(context: HabitNotificationContext): string {
    const titles = [
      `Time for ${context.habitName}! 💪`,
      `Your ${context.habitName} awaits`,
      `Ready to ${context.habitName}?`,
      `Let's do ${context.habitName} together! 🎯`,
    ];
    
    return titles[Math.floor(Math.random() * titles.length)];
  }

  /**
   * Generate context-aware reminder bodies
   */
  private generateReminderBody(context: HabitNotificationContext): string {
    const bodies = [
      `Keep up the momentum with your ${context.habitName} habit!`,
      `Just a few minutes for ${context.habitName} - you've got this!`,
      `Your future self will thank you for doing ${context.habitName} now.`,
      `Small steps, big changes. Time for ${context.habitName}!`,
    ];
    
    return bodies[Math.floor(Math.random() * bodies.length)];
  }

  /**
   * Generate motivational titles
   */
  private generateMotivationalTitle(context: HabitNotificationContext): string {
    if (context.completionRate > 0.8) {
      return "You're crushing it! 🌟";
    } else if (context.completionRate > 0.5) {
      return "Keep up the great work! 💪";
    } else {
      return "Every journey starts with a step 🚀";
    }
  }

  /**
   * Generate motivational bodies
   */
  private generateMotivationalBody(context: HabitNotificationContext): string {
    if (context.completionRate > 0.8) {
      return `Your consistency with ${context.habitName} is inspiring! Keep it up!`;
    } else if (context.completionRate > 0.5) {
      return `You're building a strong ${context.habitName} habit. Don't give up!`;
    } else {
      return `Remember, every expert was once a beginner. Your ${context.habitName} journey matters!`;
    }
  }

  /**
   * Clear all scheduled smart notifications
   */
  async clearAllScheduledNotifications(): Promise<void> {
    const promises = Array.from(this.scheduledNotifications.values()).map(id =>
      this.notificationService.cancelScheduledNotification(id)
    );
    
    await Promise.all(promises);
    this.scheduledNotifications.clear();
  }

  /**
   * Handle habit completion to update smart scheduling
   */
  async onHabitCompleted(habitId: string): Promise<void> {
    await this.recordUserActivity(habitId, 'completed');
    
    // Cancel today's notifications for this habit
    const reminderId = this.scheduledNotifications.get(`reminder_${habitId}`);
    if (reminderId) {
      await this.notificationService.cancelScheduledNotification(reminderId);
    }

    // Send achievement notification if appropriate
    await this.sendAchievementNotificationIfApplicable(habitId);
  }

  /**
   * Send achievement notification for milestones
   */
  private async sendAchievementNotificationIfApplicable(habitId: string): Promise<void> {
    // This would integrate with your achievement system
    // For now, just log
    console.log(`🏆 Checking achievements for habit ${habitId}`);
  }
}

export default SmartNotificationService;