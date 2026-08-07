import AsyncStorage from '@react-native-async-storage/async-storage';
import { dataService } from '../core';
import { achievementService } from '../premium';

export interface HabitGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  emoji: string;
  memberCount: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  joinedAt: string;
  role: 'admin' | 'moderator' | 'member';
  streak: number;
  totalPoints: number;
}

export interface ActivityFeedItem {
  id: string;
  type: 'habit_completed' | 'streak_milestone' | 'achievement_earned' | 'group_joined' | 'challenge_won';
  userId: string;
  userName: string;
  userAvatar?: string;
  habitTitle?: string;
  achievementTitle?: string;
  streakCount?: number;
  groupName?: string;
  timestamp: string;
  likes: number;
  comments: number;
}

export interface MentorProfile {
  id: string;
  name: string;
  avatar?: string;
  bio: string;
  specialties: string[];
  totalMentees: number;
  averageRating: number;
  successRate: number;
  joinedAt: string;
  badges: string[];
}

export interface ShareableContent {
  type: 'achievement' | 'streak' | 'progress' | 'milestone';
  title: string;
  description: string;
  imageUrl?: string;
  stats: {
    streakDays?: number;
    completionRate?: number;
    totalHabits?: number;
    achievementsCount?: number;
  };
}

class SocialService {
  private readonly STORAGE_KEY = 'social_data';
  private readonly GROUPS_KEY = 'habit_groups';
  private readonly ACTIVITY_FEED_KEY = 'activity_feed';
  private readonly MENTORS_KEY = 'mentors';

  private habitGroups: HabitGroup[] = [];
  private activityFeed: ActivityFeedItem[] = [];
  private mentors: MentorProfile[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadSocialData();
      await this.initializeDefaultGroups();
      await this.initializeDefaultMentors();
      this.isInitialized = true;
      console.log('✅ SocialService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SocialService:', error);
      throw error;
    }
  }

  // Habit Groups
  async getHabitGroups(category?: string): Promise<HabitGroup[]> {
    await this.initialize();
    
    if (category && category !== 'all') {
      return this.habitGroups.filter(group => group.category === category);
    }
    
    return this.habitGroups;
  }

  async getPopularGroups(limit: number = 10): Promise<HabitGroup[]> {
    await this.initialize();
    return this.habitGroups
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, limit);
  }

  async searchGroups(query: string): Promise<HabitGroup[]> {
    await this.initialize();
    const searchTerm = query.toLowerCase();
    
    return this.habitGroups.filter(group =>
      group.name.toLowerCase().includes(searchTerm) ||
      group.description.toLowerCase().includes(searchTerm) ||
      group.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  async joinGroup(groupId: string): Promise<void> {
    const group = this.habitGroups.find(g => g.id === groupId);
    if (group) {
      group.memberCount += 1;
      await this.saveSocialData();
      
      // Add to activity feed
      await this.addActivityFeedItem({
        type: 'group_joined',
        groupName: group.name,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async leaveGroup(groupId: string): Promise<void> {
    const group = this.habitGroups.find(g => g.id === groupId);
    if (group && group.memberCount > 0) {
      group.memberCount -= 1;
      await this.saveSocialData();
    }
  }

  // Activity Feed
  async getActivityFeed(limit: number = 50): Promise<ActivityFeedItem[]> {
    await this.initialize();
    return this.activityFeed
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getFriendsActivity(): Promise<ActivityFeedItem[]> {
    // In a real implementation, this would filter by friends
    // For now, return a subset of activity feed
    const allActivity = await this.getActivityFeed();
    return allActivity.slice(0, 20);
  }

  async addActivityFeedItem(item: Partial<ActivityFeedItem>): Promise<void> {
    const newItem: ActivityFeedItem = {
      id: `activity_${Date.now()}`,
      userId: 'current_user',
      userName: 'You',
      likes: 0,
      comments: 0,
      ...item,
    } as ActivityFeedItem;

    this.activityFeed.unshift(newItem);
    
    // Keep only last 1000 items
    if (this.activityFeed.length > 1000) {
      this.activityFeed = this.activityFeed.slice(0, 1000);
    }
    
    await this.saveSocialData();
  }

  // Mentorship System
  async getMentors(specialty?: string): Promise<MentorProfile[]> {
    await this.initialize();
    
    if (specialty) {
      return this.mentors.filter(mentor => 
        mentor.specialties.includes(specialty)
      );
    }
    
    return this.mentors.sort((a, b) => b.averageRating - a.averageRating);
  }

  async getRecommendedMentors(userHabits: string[]): Promise<MentorProfile[]> {
    await this.initialize();
    
    // Find mentors whose specialties match user's habit categories
    const recommended = this.mentors.filter(mentor =>
      mentor.specialties.some(specialty => userHabits.includes(specialty))
    );
    
    return recommended
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);
  }

  async requestMentorship(mentorId: string): Promise<boolean> {
    const mentor = this.mentors.find(m => m.id === mentorId);
    if (mentor) {
      mentor.totalMentees += 1;
      await this.saveSocialData();
      return true;
    }
    return false;
  }

  // Sharing Features
  async generateShareableContent(type: ShareableContent['type']): Promise<ShareableContent> {
    await dataService.initialize();
    const habits = await dataService.getHabitsWithStats();
    const achievements = achievementService.getUserAchievements();

    const totalHabits = habits.length;
    const averageCompletionRate = habits.reduce((sum, h) => sum + h.completionRate, 0) / totalHabits;
    const longestStreak = Math.max(...habits.map(h => h.longestStreak));

    switch (type) {
      case 'achievement': {
        const latestAchievement = achievements[achievements.length - 1];
        return {
          type: 'achievement',
          title: 'New achievement unlocked',
          description: latestAchievement?.achievement?.title || 'Keep building those habits!',
          stats: {
            achievementsCount: achievements.length,
            totalHabits,
          },
        };
      }
      case 'streak':
        return {
          type: 'streak',
          title: `${longestStreak} day streak`,
          description: `Crushing my habits ${longestStreak} days in a row!`,
          stats: {
            streakDays: longestStreak,
            totalHabits,
          },
        };

      case 'progress':
        return {
          type: 'progress',
          title: 'Habit progress update',
          description: `${Math.round(averageCompletionRate)}% completion rate across ${totalHabits} habits`,
          stats: {
            completionRate: Math.round(averageCompletionRate),
            totalHabits,
            achievementsCount: achievements.length,
          },
        };

      case 'milestone':
        return {
          type: 'milestone',
          title: 'Major milestone reached',
          description: `${totalHabits} active habits with ${achievements.length} achievements earned!`,
          stats: {
            totalHabits,
            achievementsCount: achievements.length,
            completionRate: Math.round(averageCompletionRate),
          },
        };
    }
  }

  async shareToSocial(content: ShareableContent, platform: 'twitter' | 'facebook' | 'instagram'): Promise<string> {
    // Generate shareable text
    let shareText = `${content.title}\n\n${content.description}\n\n`;
    
    if (content.stats.streakDays) {
      shareText += `${content.stats.streakDays} day streak\n`;
    }
    if (content.stats.completionRate) {
      shareText += `${content.stats.completionRate}% completion rate\n`;
    }
    if (content.stats.totalHabits) {
      shareText += `${content.stats.totalHabits} active habits\n`;
    }
    
    shareText += '\n#HabitTracker #SelfImprovement #iTrackHabit';

    // Return the formatted share text (in a real app, this would open share dialog)
    return shareText;
  }

  // Tracking social interactions for habits
  async trackHabitCompletion(habitId: string, habitTitle: string): Promise<void> {
    const habit = (await dataService.getHabitsWithStats()).find(h => h.id === habitId);
    if (!habit) return;

    // Add to activity feed
    await this.addActivityFeedItem({
      type: 'habit_completed',
      habitTitle,
      timestamp: new Date().toISOString(),
    });

    // Check for streak milestones
    if (habit.currentStreak > 0 && habit.currentStreak % 7 === 0) {
      await this.addActivityFeedItem({
        type: 'streak_milestone',
        habitTitle,
        streakCount: habit.currentStreak,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Analytics for social features
  async getSocialStats(): Promise<{
    groupsJoined: number;
    activitiesShared: number;
    friendsConnected: number;
    mentorshipRequests: number;
  }> {
    return {
      groupsJoined: Math.floor(Math.random() * 5) + 1, // Mock data
      activitiesShared: this.activityFeed.filter(item => item.userId === 'current_user').length,
      friendsConnected: Math.floor(Math.random() * 20) + 5,
      mentorshipRequests: Math.floor(Math.random() * 3),
    };
  }

  private async loadSocialData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const socialData = JSON.parse(data);
        this.habitGroups = socialData.habitGroups || [];
        this.activityFeed = socialData.activityFeed || [];
        this.mentors = socialData.mentors || [];
      }
    } catch (error) {
      console.error('Failed to load social data:', error);
    }
  }

  private async saveSocialData(): Promise<void> {
    try {
      const socialData = {
        habitGroups: this.habitGroups,
        activityFeed: this.activityFeed,
        mentors: this.mentors,
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(socialData));
    } catch (error) {
      console.error('Failed to save social data:', error);
    }
  }

  private async initializeDefaultGroups(): Promise<void> {
    if (this.habitGroups.length === 0) {
      this.habitGroups = [
        {
          id: 'group_1',
          name: 'Morning Warriors',
          description: 'Start your day right with morning routines and early habits',
          category: 'productivity',
          emoji: 'sunrise',
          memberCount: 847,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          tags: ['morning', 'routine', 'productivity'],
          difficulty: 'beginner',
        },
        {
          id: 'group_2',
          name: 'Fitness Fanatics',
          description: 'Daily workouts, nutrition tracking, and fitness accountability',
          category: 'health',
          emoji: 'strength',
          memberCount: 1203,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          tags: ['fitness', 'health', 'workout'],
          difficulty: 'intermediate',
        },
        {
          id: 'group_3',
          name: 'Mindful Souls',
          description: 'Meditation, gratitude, and mindfulness practices',
          category: 'mindfulness',
          emoji: 'meditate',
          memberCount: 692,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          tags: ['meditation', 'mindfulness', 'gratitude'],
          difficulty: 'beginner',
        },
        {
          id: 'group_4',
          name: 'Learning Circle',
          description: 'Daily reading, skill development, and knowledge sharing',
          category: 'learning',
          emoji: 'study',
          memberCount: 534,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          tags: ['learning', 'reading', 'skills'],
          difficulty: 'intermediate',
        },
        {
          id: 'group_5',
          name: 'Creative Collective',
          description: 'Daily creative practices, art, writing, and expression',
          category: 'creative',
          emoji: 'draw',
          memberCount: 398,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          tags: ['creative', 'art', 'writing'],
          difficulty: 'intermediate',
        },
        {
          id: 'group_6',
          name: 'Social Connectors',
          description: 'Building relationships and social habits',
          category: 'social',
          emoji: 'people',
          memberCount: 267,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          tags: ['social', 'relationships', 'community'],
          difficulty: 'beginner',
        },
      ];
      await this.saveSocialData();
    }
  }

  private async initializeDefaultMentors(): Promise<void> {
    if (this.mentors.length === 0) {
      this.mentors = [
        {
          id: 'mentor_1',
          name: 'Sarah Johnson',
          bio: 'Certified habit coach with 10+ years helping people build sustainable routines',
          specialties: ['productivity', 'morning routines', 'time management'],
          totalMentees: 127,
          averageRating: 4.9,
          successRate: 89,
          joinedAt: new Date().toISOString(),
          badges: ['Expert Coach', 'Top Rated', '1000+ Hours'],
        },
        {
          id: 'mentor_2',
          name: 'Mike Chen',
          bio: 'Former Navy SEAL, fitness trainer, and mindfulness practitioner',
          specialties: ['fitness', 'discipline', 'mindfulness'],
          totalMentees: 89,
          averageRating: 4.8,
          successRate: 92,
          joinedAt: new Date().toISOString(),
          badges: ['Military Background', 'Fitness Expert', 'Top Performer'],
        },
        {
          id: 'mentor_3',
          name: 'Dr. Emma Wilson',
          bio: 'Behavioral psychologist specializing in habit formation and behavior change',
          specialties: ['psychology', 'behavior change', 'motivation'],
          totalMentees: 156,
          averageRating: 4.9,
          successRate: 91,
          joinedAt: new Date().toISOString(),
          badges: ['PhD Psychology', 'Research Expert', 'Published Author'],
        },
        {
          id: 'mentor_4',
          name: 'Carlos Rodriguez',
          bio: 'Creative director and productivity expert, helping others unlock their potential',
          specialties: ['creative', 'productivity', 'learning'],
          totalMentees: 73,
          averageRating: 4.7,
          successRate: 86,
          joinedAt: new Date().toISOString(),
          badges: ['Creative Leader', 'Innovation Award', 'TEDx Speaker'],
        },
      ];
      await this.saveSocialData();
    }
  }
}

export const socialService = new SocialService();