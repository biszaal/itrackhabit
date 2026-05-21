import { offlineStorage, dataService } from '../core';
import { v4 as uuidv4 } from 'uuid';

// Achievement types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  type: 'streak' | 'completion' | 'consistency' | 'habit_count' | 'milestone';
  category: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'special';
  criteria: {
    targetValue: number;
    unit: string;
    habitSpecific?: boolean;
    timeframe?: number; // days
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  isActive: boolean;
}

export interface UserAchievement {
  id: string;
  achievementId: string;
  userId: string;
  earnedAt: string;
  currentValue: number;
  achievement?: Achievement;
  isNew?: boolean; // For UI notifications
}

export interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  isEarned: boolean;
  achievement: Achievement;
}

class AchievementService {
  private achievements: Achievement[] = [];
  private userAchievements: UserAchievement[] = [];

  async initialize(): Promise<void> {
    await this.loadPredefinedAchievements();
    await this.loadUserAchievements();
  }

  private async loadPredefinedAchievements(): Promise<void> {
    this.achievements = [
      // Streak Achievements
      {
        id: 'first_streak',
        title: 'First Steps',
        description: 'Complete a habit for 3 days in a row',
        icon: '🌟',
        color: '#10B981',
        type: 'streak',
        category: 'daily',
        criteria: { targetValue: 3, unit: 'days' },
        rarity: 'common',
        points: 10,
        isActive: true,
      },
      {
        id: 'week_warrior',
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '⚡',
        color: '#3B82F6',
        type: 'streak',
        category: 'weekly',
        criteria: { targetValue: 7, unit: 'days' },
        rarity: 'common',
        points: 25,
        isActive: true,
      },
      {
        id: 'month_master',
        title: 'Month Master',
        description: 'Maintain a 30-day streak',
        icon: '🔥',
        color: '#F59E0B',
        type: 'streak',
        category: 'monthly',
        criteria: { targetValue: 30, unit: 'days' },
        rarity: 'rare',
        points: 100,
        isActive: true,
      },
      {
        id: 'century_club',
        title: 'Century Club',
        description: 'Achieve a 100-day streak',
        icon: '💯',
        color: '#8B5CF6',
        type: 'streak',
        category: 'special',
        criteria: { targetValue: 100, unit: 'days' },
        rarity: 'epic',
        points: 500,
        isActive: true,
      },
      {
        id: 'legendary_streak',
        title: 'Legendary Streak',
        description: 'Achieve a 365-day streak',
        icon: '👑',
        color: '#EF4444',
        type: 'streak',
        category: 'yearly',
        criteria: { targetValue: 365, unit: 'days' },
        rarity: 'legendary',
        points: 2000,
        isActive: true,
      },

      // Completion Achievements
      {
        id: 'first_completion',
        title: 'Getting Started',
        description: 'Complete your first habit',
        icon: '✅',
        color: '#10B981',
        type: 'completion',
        category: 'daily',
        criteria: { targetValue: 1, unit: 'completions' },
        rarity: 'common',
        points: 5,
        isActive: true,
      },
      {
        id: 'ten_completions',
        title: 'Building Momentum',
        description: 'Complete 10 habit instances',
        icon: '🎯',
        color: '#3B82F6',
        type: 'completion',
        category: 'daily',
        criteria: { targetValue: 10, unit: 'completions' },
        rarity: 'common',
        points: 20,
        isActive: true,
      },
      {
        id: 'hundred_completions',
        title: 'Habit Hero',
        description: 'Complete 100 habit instances',
        icon: '🦸',
        color: '#F59E0B',
        type: 'completion',
        category: 'special',
        criteria: { targetValue: 100, unit: 'completions' },
        rarity: 'rare',
        points: 200,
        isActive: true,
      },
      {
        id: 'thousand_completions',
        title: 'Habit Legend',
        description: 'Complete 1000 habit instances',
        icon: '🌟',
        color: '#8B5CF6',
        type: 'completion',
        category: 'special',
        criteria: { targetValue: 1000, unit: 'completions' },
        rarity: 'epic',
        points: 1000,
        isActive: true,
      },

      // Consistency Achievements
      {
        id: 'consistent_week',
        title: 'Consistent Week',
        description: 'Complete all habits for 7 consecutive days',
        icon: '📅',
        color: '#06B6D4',
        type: 'consistency',
        category: 'weekly',
        criteria: { targetValue: 7, unit: 'days', timeframe: 7 },
        rarity: 'common',
        points: 50,
        isActive: true,
      },
      {
        id: 'perfect_month',
        title: 'Perfect Month',
        description: 'Complete all habits for an entire month',
        icon: '🏆',
        color: '#F59E0B',
        type: 'consistency',
        category: 'monthly',
        criteria: { targetValue: 30, unit: 'days', timeframe: 30 },
        rarity: 'rare',
        points: 300,
        isActive: true,
      },

      // Habit Count Achievements
      {
        id: 'habit_collector',
        title: 'Habit Collector',
        description: 'Create 5 different habits',
        icon: '📋',
        color: '#10B981',
        type: 'habit_count',
        category: 'daily',
        criteria: { targetValue: 5, unit: 'habits' },
        rarity: 'common',
        points: 30,
        isActive: true,
      },
      {
        id: 'habit_master',
        title: 'Habit Master',
        description: 'Create 10 different habits',
        icon: '🎨',
        color: '#8B5CF6',
        type: 'habit_count',
        category: 'special',
        criteria: { targetValue: 10, unit: 'habits' },
        rarity: 'rare',
        points: 100,
        isActive: true,
      },

      // Milestone Achievements
      {
        id: 'early_bird',
        title: 'Early Bird',
        description: 'Complete a habit before 7 AM',
        icon: '🌅',
        color: '#F59E0B',
        type: 'milestone',
        category: 'special',
        criteria: { targetValue: 1, unit: 'early_completions' },
        rarity: 'common',
        points: 15,
        isActive: true,
      },
      {
        id: 'night_owl',
        title: 'Night Owl',
        description: 'Complete a habit after 10 PM',
        icon: '🦉',
        color: '#6366F1',
        type: 'milestone',
        category: 'special',
        criteria: { targetValue: 1, unit: 'late_completions' },
        rarity: 'common',
        points: 15,
        isActive: true,
      },
    ];
  }

  private async loadUserAchievements(): Promise<void> {
    try {
      // In offline-first architecture, we'd load from local storage
      // For now, initialize empty array - achievements are calculated on-demand
      this.userAchievements = [];
    } catch (error) {
      console.error('Error loading user achievements:', error);
      this.userAchievements = [];
    }
  }

  async checkForNewAchievements(): Promise<UserAchievement[]> {
    try {
      await dataService.initialize();
      const habits = await dataService.getHabitsWithStats();
      const newAchievements: UserAchievement[] = [];

      for (const achievement of this.achievements) {
        if (!achievement.isActive) continue;
        
        // Check if user already has this achievement
        const existingUserAchievement = this.userAchievements.find(
          ua => ua.achievementId === achievement.id
        );
        
        if (existingUserAchievement) continue;

        // Calculate current progress for this achievement
        const currentValue = await this.calculateAchievementProgress(achievement, habits);
        
        // Check if achievement is earned
        if (currentValue >= achievement.criteria.targetValue) {
          const userAchievement: UserAchievement = {
            id: uuidv4(),
            achievementId: achievement.id,
            userId: 'offline_user', // Will be set by auth service
            earnedAt: new Date().toISOString(),
            currentValue,
            achievement,
            isNew: true,
          };

          newAchievements.push(userAchievement);
          this.userAchievements.push(userAchievement);
        }
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking for new achievements:', error);
      return [];
    }
  }

  private async calculateAchievementProgress(
    achievement: Achievement, 
    habits: any[]
  ): Promise<number> {
    try {
      switch (achievement.type) {
        case 'streak':
          return this.calculateMaxStreak(habits);
        
        case 'completion':
          return this.calculateTotalCompletions(habits);
        
        case 'consistency':
          return await this.calculateConsistencyDays(achievement.criteria.timeframe || 7);
        
        case 'habit_count':
          return habits.filter(h => !h.deletedAt).length;
        
        case 'milestone':
          return await this.calculateMilestoneProgress(achievement);
        
        default:
          return 0;
      }
    } catch (error) {
      console.error('Error calculating achievement progress:', error);
      return 0;
    }
  }

  private calculateMaxStreak(habits: any[]): number {
    const streaks = habits.map(habit => habit.currentStreak || 0);
    return Math.max(...streaks, 0);
  }

  private calculateTotalCompletions(habits: any[]): number {
    return habits.reduce((total, habit) => total + (habit.totalCompletions || 0), 0);
  }

  private async calculateConsistencyDays(timeframe: number): Promise<number> {
    try {
      const today = new Date();
      const startDate = new Date(today.getTime() - timeframe * 24 * 60 * 60 * 1000);
      
      const dailyStats = await dataService.getDailyStats(
        startDate.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      // Count days where all habits were completed
      return dailyStats.filter(day => day.completionRate === 100).length;
    } catch (error) {
      console.error('Error calculating consistency:', error);
      return 0;
    }
  }

  private async calculateMilestoneProgress(achievement: Achievement): Promise<number> {
    // Milestone achievements require specific logic based on the type
    // For now, return 0 as these would need habit completion time tracking
    return 0;
  }

  async getAchievementProgress(): Promise<AchievementProgress[]> {
    try {
      await dataService.initialize();
      const habits = await dataService.getHabitsWithStats();
      const progress: AchievementProgress[] = [];

      for (const achievement of this.achievements) {
        if (!achievement.isActive) continue;

        const currentValue = await this.calculateAchievementProgress(achievement, habits);
        const isEarned = this.userAchievements.some(ua => ua.achievementId === achievement.id);
        
        progress.push({
          achievementId: achievement.id,
          currentValue,
          targetValue: achievement.criteria.targetValue,
          progressPercentage: Math.min((currentValue / achievement.criteria.targetValue) * 100, 100),
          isEarned,
          achievement,
        });
      }

      return progress.sort((a, b) => {
        // Sort earned achievements first, then by progress percentage
        if (a.isEarned && !b.isEarned) return -1;
        if (!a.isEarned && b.isEarned) return 1;
        return b.progressPercentage - a.progressPercentage;
      });
    } catch (error) {
      console.error('Error getting achievement progress:', error);
      return [];
    }
  }

  getUserAchievements(): UserAchievement[] {
    return [...this.userAchievements];
  }

  getAchievementById(id: string): Achievement | undefined {
    return this.achievements.find(a => a.id === id);
  }

  getTotalPoints(): number {
    return this.userAchievements.reduce((total, ua) => {
      return total + (ua.achievement?.points || 0);
    }, 0);
  }

  getAchievementsByCategory(category: string): Achievement[] {
    return this.achievements.filter(a => a.category === category && a.isActive);
  }

  getAchievementsByRarity(rarity: string): Achievement[] {
    return this.achievements.filter(a => a.rarity === rarity && a.isActive);
  }

  // Mark achievements as seen (remove the "new" flag)
  markAchievementsSeen(): void {
    this.userAchievements.forEach(ua => {
      ua.isNew = false;
    });
  }

  // Get statistics about user's achievements
  getAchievementStats(): {
    earned: number;
    total: number;
    points: number;
    rarityBreakdown: { [key: string]: number };
    categoryBreakdown: { [key: string]: number };
  } {
    const earned = this.userAchievements.length;
    const total = this.achievements.filter(a => a.isActive).length;
    const points = this.getTotalPoints();

    const rarityBreakdown: { [key: string]: number } = {};
    const categoryBreakdown: { [key: string]: number } = {};

    this.userAchievements.forEach(ua => {
      if (ua.achievement) {
        const rarity = ua.achievement.rarity;
        const category = ua.achievement.category;
        
        rarityBreakdown[rarity] = (rarityBreakdown[rarity] || 0) + 1;
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
      }
    });

    return {
      earned,
      total,
      points,
      rarityBreakdown,
      categoryBreakdown,
    };
  }
}

export const achievementService = new AchievementService();