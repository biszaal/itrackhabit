import { apiClient, API_CONFIG } from '../../constants/api';
import { dataService } from '../core/DataService';
import { toLocalISODate } from '../../utils/formatting/time';

export interface UserStats {
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  perfectDays: number;
  totalHabits: number;
  activeChallenges: number;
  friendsCount: number;
  lastActivity: string;
  moodScore?: number;
  stressLevel?: number;
}

export interface DailyMood {
  date: string;
  mood: 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy';
  emoji: string;
  note?: string;
}

class UserStatsService {
  private cachedStats: UserStats | null = null;
  private lastStatsUpdate: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getUserStats(forceRefresh: boolean = false): Promise<UserStats> {
    // Return cached stats if available and not expired
    if (!forceRefresh && this.cachedStats && this.lastStatsUpdate) {
      const now = new Date();
      const timeDiff = now.getTime() - this.lastStatsUpdate.getTime();
      if (timeDiff < this.CACHE_DURATION) {
        return this.cachedStats;
      }
    }

    try {
      const habitsWithStats = await dataService.getHabitsWithStats();
      const habits = await dataService.getHabits();
      
      // Calculate overall completion rate
      const totalCompletions = habitsWithStats.reduce((sum, habit) => sum + habit.totalCompletions, 0);
      const totalPossibleCompletions = habitsWithStats.length * 30; // Last 30 days
      const completionRate = totalPossibleCompletions > 0 
        ? Math.round((totalCompletions / totalPossibleCompletions) * 100) 
        : 0;

      // Calculate streaks
      const currentStreak = Math.max(...habitsWithStats.map(h => h.currentStreak), 0);
      const longestStreak = Math.max(...habitsWithStats.map(h => h.longestStreak), 0);

      // Calculate perfect days (days where all habits were completed)
      const perfectDays = await this.calculatePerfectDays();

      // Get mood and stress data
      const moodData = await this.getCurrentMood();
      const stressData = await this.getCurrentStressLevel();

      const stats: UserStats = {
        completionRate,
        currentStreak,
        longestStreak,
        totalCompletions,
        perfectDays,
        totalHabits: habits.length,
        activeChallenges: 0, // TODO: Get from challenges service
        friendsCount: 0, // TODO: Get from friends service
        lastActivity: new Date().toISOString(),
        moodScore: moodData?.mood === 'very_happy' ? 5 : 
                  moodData?.mood === 'happy' ? 4 :
                  moodData?.mood === 'neutral' ? 3 :
                  moodData?.mood === 'sad' ? 2 :
                  moodData?.mood === 'very_sad' ? 1 : undefined,
        stressLevel: stressData,
      };

      // Cache the results
      this.cachedStats = stats;
      this.lastStatsUpdate = new Date();

      return stats;
    } catch (error) {
      console.error('Failed to calculate user stats:', error);
      
      // Return default stats on error
      return {
        completionRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        perfectDays: 0,
        totalHabits: 0,
        activeChallenges: 0,
        friendsCount: 0,
        lastActivity: new Date().toISOString(),
      };
    }
  }

  private async calculatePerfectDays(): Promise<number> {
    try {
      const endDate = toLocalISODate();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = toLocalISODate(startDate);

      // Calculate perfect days manually since we don't have a bulk method yet
      let perfectDays = 0;
      const currentDate = new Date(startDate);
      const end = new Date();
      
      while (currentDate <= end) {
        const dateStr = toLocalISODate(currentDate);
        const dayStatsArray = await dataService.getDailyStats(dateStr, dateStr);
        const dayStats = dayStatsArray[0];
        
        if (dayStats && dayStats.totalHabits > 0 && dayStats.completedHabits === dayStats.totalHabits) {
          perfectDays++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return perfectDays;
    } catch (error) {
      console.error('Failed to calculate perfect days:', error);
      return 0;
    }
  }

  async getCurrentMood(): Promise<DailyMood | null> {
    try {
      // TODO: Implement mood tracking storage
      // For now, return a sample mood based on cached stats to avoid recursion
      const today = toLocalISODate();
      
      // Use cached stats if available, otherwise return neutral
      if (this.cachedStats) {
        if (this.cachedStats.completionRate >= 80) {
          return { date: today, mood: 'very_happy', emoji: '😊' };
        } else if (this.cachedStats.completionRate >= 60) {
          return { date: today, mood: 'happy', emoji: '🙂' };
        } else if (this.cachedStats.completionRate >= 40) {
          return { date: today, mood: 'neutral', emoji: '😐' };
        } else if (this.cachedStats.completionRate >= 20) {
          return { date: today, mood: 'sad', emoji: '😔' };
        } else {
          return { date: today, mood: 'very_sad', emoji: '😢' };
        }
      }
      
      // Default to neutral mood if no cached stats
      return { date: today, mood: 'neutral', emoji: '😐' };
    } catch (error) {
      console.error('Failed to get current mood:', error);
      return null;
    }
  }

  async getCurrentStressLevel(): Promise<number | undefined> {
    try {
      // TODO: Implement stress level tracking
      // For now, return a level based on cached stats to avoid recursion
      if (this.cachedStats) {
        if (this.cachedStats.currentStreak >= 7) return 2; // Low stress
        if (this.cachedStats.currentStreak >= 3) return 5; // Medium stress
        return 8; // High stress
      }
      
      // Default to medium stress if no cached stats
      return 5;
    } catch (error) {
      console.error('Failed to get stress level:', error);
      return undefined;
    }
  }

  async getGreeting(): Promise<string> {
    const hour = new Date().getHours();
    
    let timeGreeting = '';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    const encouragements = [
      "Let's make today count!",
      "You're doing great!",
      "Keep up the momentum!",
      "Every small step matters!",
      "You've got this!",
    ];

    // Use cached stats if available to avoid recursion
    if (this.cachedStats && this.cachedStats.currentStreak > 0) {
      return `${timeGreeting}! ${this.cachedStats.currentStreak} day streak`;
    }

    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    return `${timeGreeting}! ${randomEncouragement}`;
  }

  async getDateLabel(): Promise<string> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if yesterday was completed
    const yesterdayStr = toLocalISODate(yesterday);
    const habits = await dataService.getHabits();
    
    let completedYesterday = 0;
    for (const habit of habits) {
      const progress = await dataService.getHabitProgressForDate(habit.id, yesterdayStr);
      if (progress?.status === 'done') {
        completedYesterday++;
      }
    }
    
    const wasYesterdayPerfect = habits.length > 0 && completedYesterday === habits.length;
    return wasYesterdayPerfect ? 'Yesterday' : 'Today';
  }

  invalidateCache(): void {
    this.cachedStats = null;
    this.lastStatsUpdate = null;
  }
}

export const userStatsService = new UserStatsService();