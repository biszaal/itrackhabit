import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dataService } from '../core/DataService';
import { Habit, HabitWithStats } from '../../types';
import { toLocalISODate } from '../../utils/formatting/time';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface HabitReminderSettings {
  habitId: string;
  enabled: boolean;
  reminderTimes: string[]; // ["09:00", "18:00"]
  smartTiming: boolean; // Use AI-based optimal timing
  streakProtection: boolean; // Send reminders if streak is at risk
  motivationalStyle: 'gentle' | 'encouraging' | 'challenging';
  weekdaysOnly: boolean;
  customMessage?: string;
}

export interface NotificationInsights {
  optimalTimes: number[]; // Hours when user is most active
  responseRate: number; // How often user acts on notifications
  bestPerformingTime: number; // Hour with highest completion rate
  streakRiskHours: number[]; // Hours when user typically misses habits
}

interface ScheduledNotification {
  id: string;
  habitId: string;
  type: 'reminder' | 'streak_protection' | 'motivation' | 'weekly_summary';
  scheduledFor: Date;
  notificationId?: string;
}

class EnhancedNotificationService {
  private static instance: EnhancedNotificationService;
  private readonly SETTINGS_KEY = 'enhanced_notification_settings';
  private readonly INSIGHTS_KEY = 'notification_insights';
  private readonly SCHEDULED_KEY = 'scheduled_notifications';
  
  private scheduledNotifications: ScheduledNotification[] = [];

  static getInstance(): EnhancedNotificationService {
    if (!EnhancedNotificationService.instance) {
      EnhancedNotificationService.instance = new EnhancedNotificationService();
    }
    return EnhancedNotificationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      // Load scheduled notifications
      await this.loadScheduledNotifications();
      
      // Schedule notifications for all habits
      await this.scheduleAllHabitNotifications();
      
      console.log('🔔 Enhanced Notification Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize enhanced notifications:', error);
    }
  }

  async getHabitReminderSettings(habitId: string): Promise<HabitReminderSettings> {
    try {
      const stored = await AsyncStorage.getItem(`${this.SETTINGS_KEY}_${habitId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Default settings
      return {
        habitId,
        enabled: true,
        reminderTimes: ['09:00', '20:00'],
        smartTiming: true,
        streakProtection: true,
        motivationalStyle: 'encouraging',
        weekdaysOnly: false,
      };
    } catch (error) {
      console.error('Failed to get habit reminder settings:', error);
      return {
        habitId,
        enabled: true,
        reminderTimes: ['09:00', '20:00'],
        smartTiming: true,
        streakProtection: true,
        motivationalStyle: 'encouraging',
        weekdaysOnly: false,
      };
    }
  }

  async saveHabitReminderSettings(settings: HabitReminderSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(`${this.SETTINGS_KEY}_${settings.habitId}`, JSON.stringify(settings));
      // Reschedule notifications for this habit
      await this.scheduleHabitNotifications(settings.habitId);
    } catch (error) {
      console.error('Failed to save habit reminder settings:', error);
    }
  }

  async scheduleAllHabitNotifications(): Promise<void> {
    try {
      await dataService.initialize();
      const habits = await dataService.getHabits();
      
      // Cancel existing notifications
      await this.cancelAllScheduledNotifications();
      
      // Schedule notifications for each habit
      for (const habit of habits) {
        if (!habit.deletedAt) {
          await this.scheduleHabitNotifications(habit.id);
        }
      }
    } catch (error) {
      console.error('Failed to schedule all habit notifications:', error);
    }
  }

  async scheduleHabitNotifications(habitId: string): Promise<void> {
    try {
      const habits = await dataService.getHabits();
      const habit = habits.find(h => h.id === habitId);
      if (!habit || habit.deletedAt) return;

      const settings = await this.getHabitReminderSettings(habitId);
      if (!settings.enabled) return;

      const insights = await this.getNotificationInsights(habitId);
      const reminderTimes = settings.smartTiming && insights.optimalTimes.length > 0
        ? insights.optimalTimes.slice(0, 2).map(hour => `${hour.toString().padStart(2, '0')}:00`)
        : settings.reminderTimes;

      // Schedule daily reminders
      for (const timeStr of reminderTimes) {
        await this.scheduleHabitReminder(habit, settings, timeStr);
      }

      // Schedule streak protection if enabled
      if (settings.streakProtection) {
        await this.scheduleStreakProtectionNotifications(habit, settings);
      }

      console.log(`📅 Scheduled notifications for habit: ${habit.title}`);
    } catch (error) {
      console.error('Failed to schedule habit notifications:', error);
    }
  }

  private async scheduleHabitReminder(
    habit: Habit, 
    settings: HabitReminderSettings, 
    timeStr: string
  ): Promise<void> {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    
    // Schedule for the next 7 days
    for (let day = 0; day < 7; day++) {
      const scheduledDate = new Date(now);
      scheduledDate.setDate(now.getDate() + day);
      scheduledDate.setHours(hours, minutes, 0, 0);
      
      // Skip if in the past
      if (scheduledDate <= now) continue;
      
      // Skip weekends if weekdaysOnly is true
      if (settings.weekdaysOnly && (scheduledDate.getDay() === 0 || scheduledDate.getDay() === 6)) {
        continue;
      }

      const message = this.generateReminderMessage(habit, settings);
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time for ${habit.title}! ${habit.emoji || '⏰'}`,
          body: message,
          data: {
            habitId: habit.id,
            type: 'habit_reminder',
            scheduledTime: timeStr,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE as any,
          date: scheduledDate,
        },
      });

      // Track scheduled notification
      this.scheduledNotifications.push({
        id: `${habit.id}_reminder_${scheduledDate.getTime()}`,
        habitId: habit.id,
        type: 'reminder',
        scheduledFor: scheduledDate,
        notificationId,
      });
    }
  }

  private async scheduleStreakProtectionNotifications(
    habit: Habit,
    settings: HabitReminderSettings
  ): Promise<void> {
    try {
      // Get habit stats to check current streak
      const habitStats = await dataService.getHabitsWithStats();
      const habitStat = habitStats.find(h => h.id === habit.id);
      
      if (!habitStat || habitStat.currentStreak === 0) return;

      // Schedule streak protection 2 hours before midnight if habit not completed
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(22, 0, 0, 0); // 10 PM

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Don't break your ${habitStat.currentStreak}-day streak! 🔥`,
          body: `You haven't completed "${habit.title}" today. Keep your momentum going!`,
          data: {
            habitId: habit.id,
            type: 'streak_protection',
            currentStreak: habitStat.currentStreak,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE as any,
          date: tomorrow,
        },
      });

      this.scheduledNotifications.push({
        id: `${habit.id}_streak_${tomorrow.getTime()}`,
        habitId: habit.id,
        type: 'streak_protection',
        scheduledFor: tomorrow,
        notificationId,
      });
    } catch (error) {
      console.error('Failed to schedule streak protection:', error);
    }
  }

  private generateReminderMessage(habit: Habit, settings: HabitReminderSettings): string {
    if (settings.customMessage) {
      return settings.customMessage;
    }

    const messages = {
      gentle: [
        "A gentle reminder to take care of yourself",
        "When you're ready, this habit is waiting",
        "No pressure, just a friendly nudge",
        "Small steps lead to big changes",
      ],
      encouraging: [
        "You've got this! Time to build your habit",
        "Another step towards your goals awaits",
        "Your future self will thank you",
        "Progress happens one habit at a time",
        "Every small action counts",
      ],
      challenging: [
        "Champions never skip their habits",
        "Discipline is doing what needs to be done",
        "Your goals are waiting for action",
        "Excuses or results - you choose",
        "Make it happen!",
      ],
    };

    const styleMessages = messages[settings.motivationalStyle];
    return styleMessages[Math.floor(Math.random() * styleMessages.length)];
  }

  async getNotificationInsights(habitId: string): Promise<NotificationInsights> {
    try {
      const stored = await AsyncStorage.getItem(`${this.INSIGHTS_KEY}_${habitId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Calculate insights from habit completion data
      const habits = await dataService.getHabits();
      const habit = habits.find(h => h.id === habitId);
      if (!habit) {
        return {
          optimalTimes: [],
          responseRate: 0,
          bestPerformingTime: 9,
          streakRiskHours: [22, 23],
        };
      }

      // Get completion data to analyze patterns
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const progress = await dataService.getHabitProgress(
        habitId,
        toLocalISODate(thirtyDaysAgo),
        toLocalISODate()
      );

      // Analyze completion times to find optimal hours
      const hourlyCompletions: Record<number, number> = {};
      progress.forEach(p => {
        const hour = new Date(p.updatedAt).getHours();
        hourlyCompletions[hour] = (hourlyCompletions[hour] || 0) + 1;
      });

      // Find top 3 hours
      const optimalTimes = Object.entries(hourlyCompletions)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));

      const insights: NotificationInsights = {
        optimalTimes,
        responseRate: progress.length > 0 ? (progress.filter(p => p.status === 'done').length / progress.length) * 100 : 0,
        bestPerformingTime: optimalTimes[0] || 9,
        streakRiskHours: [22, 23], // Default late hours for streak protection
      };

      // Cache insights
      await AsyncStorage.setItem(`${this.INSIGHTS_KEY}_${habitId}`, JSON.stringify(insights));
      
      return insights;
    } catch (error) {
      console.error('Failed to get notification insights:', error);
      return {
        optimalTimes: [],
        responseRate: 0,
        bestPerformingTime: 9,
        streakRiskHours: [22, 23],
      };
    }
  }

  async scheduleWeeklySummaryNotification(): Promise<void> {
    try {
      // Schedule for Sunday evening
      const nextSunday = new Date();
      const daysUntilSunday = 7 - nextSunday.getDay();
      nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
      nextSunday.setHours(19, 0, 0, 0); // 7 PM

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Your Weekly Habit Summary',
          body: 'Check out your progress and achievements from this week!',
          data: {
            type: 'weekly_summary',
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE as any,
          date: nextSunday,
        },
      });

      this.scheduledNotifications.push({
        id: `weekly_summary_${nextSunday.getTime()}`,
        habitId: 'all',
        type: 'weekly_summary',
        scheduledFor: nextSunday,
        notificationId,
      });
    } catch (error) {
      console.error('Failed to schedule weekly summary:', error);
    }
  }

  private async loadScheduledNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.SCHEDULED_KEY);
      this.scheduledNotifications = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
      this.scheduledNotifications = [];
    }
  }

  private async saveScheduledNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SCHEDULED_KEY, JSON.stringify(this.scheduledNotifications));
    } catch (error) {
      console.error('Failed to save scheduled notifications:', error);
    }
  }

  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      // Cancel all Expo notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Clear our tracking
      this.scheduledNotifications = [];
      await this.saveScheduledNotifications();
      
      console.log('🚫 Cancelled all scheduled notifications');
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  async cancelHabitNotifications(habitId: string): Promise<void> {
    try {
      // Filter notifications for this habit
      const habitNotifications = this.scheduledNotifications.filter(n => n.habitId === habitId);
      
      // Cancel each notification
      for (const notification of habitNotifications) {
        if (notification.notificationId) {
          await Notifications.cancelScheduledNotificationAsync(notification.notificationId);
        }
      }
      
      // Remove from tracking
      this.scheduledNotifications = this.scheduledNotifications.filter(n => n.habitId !== habitId);
      await this.saveScheduledNotifications();
      
      console.log(`🚫 Cancelled notifications for habit: ${habitId}`);
    } catch (error) {
      console.error('Failed to cancel habit notifications:', error);
    }
  }

  // Record when user interacts with notifications for learning
  async recordNotificationInteraction(
    habitId: string, 
    action: 'opened' | 'dismissed' | 'completed_habit'
  ): Promise<void> {
    try {
      const key = `notification_interactions_${habitId}`;
      const stored = await AsyncStorage.getItem(key);
      const interactions = stored ? JSON.parse(stored) : [];
      
      interactions.push({
        action,
        timestamp: new Date().toISOString(),
        hour: new Date().getHours(),
      });
      
      // Keep only last 100 interactions
      if (interactions.length > 100) {
        interactions.splice(0, interactions.length - 100);
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(interactions));
    } catch (error) {
      console.error('Failed to record notification interaction:', error);
    }
  }

  // Get notification statistics for a habit
  async getNotificationStats(habitId: string): Promise<{
    totalSent: number;
    responseRate: number;
    bestTimes: number[];
    avgResponseTime: number; // minutes
  }> {
    try {
      const key = `notification_interactions_${habitId}`;
      const stored = await AsyncStorage.getItem(key);
      const interactions = stored ? JSON.parse(stored) : [];
      
      if (interactions.length === 0) {
        return {
          totalSent: 0,
          responseRate: 0,
          bestTimes: [],
          avgResponseTime: 0,
        };
      }

      const completed = interactions.filter((i: any) => i.action === 'completed_habit');
      const responseRate = (completed.length / interactions.length) * 100;
      
      // Find best performing hours
      const hourlySuccess: Record<number, { total: number; completed: number }> = {};
      interactions.forEach((interaction: any) => {
        const hour = interaction.hour;
        if (!hourlySuccess[hour]) {
          hourlySuccess[hour] = { total: 0, completed: 0 };
        }
        hourlySuccess[hour].total++;
        if (interaction.action === 'completed_habit') {
          hourlySuccess[hour].completed++;
        }
      });

      const bestTimes = Object.entries(hourlySuccess)
        .map(([hour, stats]) => ({
          hour: parseInt(hour),
          rate: stats.completed / stats.total
        }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 3)
        .map(item => item.hour);

      return {
        totalSent: interactions.length,
        responseRate,
        bestTimes,
        avgResponseTime: 30, // Placeholder - would need timestamp analysis
      };
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return {
        totalSent: 0,
        responseRate: 0,
        bestTimes: [],
        avgResponseTime: 0,
      };
    }
  }
}

export const enhancedNotificationService = EnhancedNotificationService.getInstance();