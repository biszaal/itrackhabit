import { apiClient, API_CONFIG } from '../../constants/api';
import { 
  Badge, 
  UserBadge, 
  BadgeProgress,
  HabitProgress,
  ChallengeParticipant 
} from '../../types';

class BadgeService {
  // Get all available badges
  async getBadges(): Promise<Badge[]> {
    try {
      const badges = await apiClient.get<Badge[]>('/api/badges');
      
      return badges || [];
    } catch (error) {
      return [];
    }
  }

  // Get user's earned badges
  async getUserBadges(): Promise<UserBadge[]> {
    try {
      const userBadges = await apiClient.get<UserBadge[]>('/api/user-badges');
      
      return userBadges || [];
    } catch (error) {
      return [];
    }
  }

  // Get user's badge progress
  async getBadgeProgress(): Promise<BadgeProgress[]> {
    try {
      const progress = await apiClient.get<BadgeProgress[]>('/api/badge-progress');
      
      return progress || [];
    } catch (error) {
      return [];
    }
  }

  // Get badge progress for a specific badge
  async getBadgeProgressForBadge(badgeId: string): Promise<BadgeProgress | null> {
    try {
      const progress = await apiClient.get<BadgeProgress>(
        `/badges/${badgeId}/progress`
      );
      
      return progress;
    } catch (error) {
      console.error('Error fetching badge progress:', error);
      return null;
    }
  }

  // Check and update badge progress for user
  async checkBadgeProgress(userId: string): Promise<{ newBadges: Badge[]; updatedProgress: BadgeProgress[] }> {
    try {
      const result = await apiClient.post<{ newBadges: Badge[]; updatedProgress: BadgeProgress[] }>(
        '/badges/check-progress',
        { userId }
      );
      
      return result;
    } catch (error) {
      console.error('Error checking badge progress:', error);
      return { newBadges: [], updatedProgress: [] };
    }
  }

  // Award badge to user (admin function)
  async awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
    try {
      const userBadge = await apiClient.post<UserBadge>(
        '/badges/award',
        { userId, badgeId }
      );
      
      return userBadge;
    } catch (error) {
      console.error('Error awarding badge:', error);
      throw error;
    }
  }

  // Calculate badge progress based on user activity
  async calculateBadgeProgress(
    badge: Badge,
    userHabits: any[],
    habitProgress: HabitProgress[],
    challenges: ChallengeParticipant[]
  ): Promise<BadgeProgress> {
    try {
      const result = await apiClient.post<BadgeProgress>(
        '/badges/calculate-progress',
        {
          badgeId: badge.id,
          userHabits,
          habitProgress,
          challenges
        }
      );
      
      return result;
    } catch (error) {
      console.error('Error calculating badge progress:', error);
      
      // Fallback to local calculation if API fails
      return this.calculateBadgeProgressLocally(badge, userHabits, habitProgress, challenges);
    }
  }

  // Local fallback calculation for badge progress
  private calculateBadgeProgressLocally(
    badge: Badge,
    userHabits: any[],
    habitProgress: HabitProgress[],
    challenges: ChallengeParticipant[]
  ): BadgeProgress {
    let currentValue = 0;
    let isEarned = false;
    let progressPercentage = 0;

    try {
      switch (badge.type) {
        case 'streak':
          // Calculate longest streak
          const streaks = userHabits.map(habit => 
            this.calculateStreakForHabit(habit.id, habitProgress)
          );
          currentValue = Math.max(...streaks, 0);
          break;

        case 'completion':
          // Calculate total completions
          currentValue = habitProgress.filter(p => p.status === 'done').length;
          break;

        case 'habit_count':
          // Count total habits
          currentValue = userHabits.length;
          break;

        case 'challenge':
          // Count completed challenges
          currentValue = challenges.filter(c => c.status === 'completed').length;
          break;

        case 'consistency':
          // Calculate consistency percentage
          const totalDays = this.getDaysBetween(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            new Date()
          );
          const completedDays = new Set(
            habitProgress
              .filter(p => p.status === 'done')
              .map(p => p.date.split('T')[0])
          ).size;
          currentValue = Math.round((completedDays / totalDays) * 100);
          break;

        default:
          currentValue = 0;
      }

      // Check if badge is earned
      isEarned = currentValue >= badge.targetValue;
      
      // Calculate progress percentage
      progressPercentage = Math.min((currentValue / badge.targetValue) * 100, 100);

      return {
        id: `progress_${badge.id}`,
        badgeId: badge.id,
        userId: 'current_user', // Will be set by backend
        currentValue,
        targetValue: badge.targetValue,
        progressPercentage: Math.round(progressPercentage),
        isEarned,
        earnedAt: isEarned ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        badge
      };
    } catch (error) {
      console.error('Error in local badge calculation:', error);
      
      return {
        id: `progress_${badge.id}`,
        badgeId: badge.id,
        userId: 'current_user',
        currentValue: 0,
        targetValue: badge.targetValue,
        progressPercentage: 0,
        isEarned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        badge
      };
    }
  }

  // Helper method to calculate streak for a specific habit
  private calculateStreakForHabit(habitId: string, habitProgress: HabitProgress[]): number {
    const habitEntries = habitProgress
      .filter(p => p.habitId === habitId && p.status === 'done')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (habitEntries.length === 0) return 0;

    let currentStreak = 0;
    let expectedDate = new Date();
    expectedDate.setHours(0, 0, 0, 0);

    for (const entry of habitEntries) {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);

      if (entryDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }

    return currentStreak;
  }

  // Helper method to calculate days between dates
  private getDaysBetween(startDate: Date, endDate: Date): number {
    const timeDifference = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDifference / (1000 * 3600 * 24));
  }

  // Get badge categories
  async getBadgeCategories(): Promise<string[]> {
    try {
      const categories = await apiClient.get<string[]>(
        '/badges/categories'
      );
      
      return categories;
    } catch (error) {
      console.error('Error fetching badge categories:', error);
      return ['Streaks', 'Completion', 'Habits', 'Challenges', 'Consistency'];
    }
  }

  // Get badges by category
  async getBadgesByCategory(category: string): Promise<Badge[]> {
    try {
      const badges = await apiClient.get<Badge[]>(
        `/badges/category/${encodeURIComponent(category)}`
      );
      
      return badges;
    } catch (error) {
      console.error('Error fetching badges by category:', error);
      return [];
    }
  }

  // Get leaderboard for a specific badge
  async getBadgeLeaderboard(badgeId: string): Promise<any[]> {
    try {
      const leaderboard = await apiClient.get<any[]>(
        `/badges/${badgeId}/leaderboard`
      );
      
      return leaderboard;
    } catch (error) {
      console.error('Error fetching badge leaderboard:', error);
      return [];
    }
  }

  // Share badge achievement
  async shareBadge(badgeId: string, platform: 'social' | 'friends'): Promise<void> {
    try {
      await apiClient.post(
        `/badges/${badgeId}/share`,
        { platform }
      );
    } catch (error) {
      console.error('Error sharing badge:', error);
      throw error;
    }
  }

  // Check habit completion badges
  async checkHabitCompletionBadges(progress: HabitProgress): Promise<UserBadge[]> {
    try {
      const earnedBadges = await apiClient.post<UserBadge[]>(
        API_CONFIG.ENDPOINTS.BADGES.CHECK_ACHIEVEMENTS,
        { progress }
      );
      
      return earnedBadges;
    } catch (error) {
      console.error('Error checking habit completion badges:', error);
      return [];
    }
  }
}

export const badgeService = new BadgeService();