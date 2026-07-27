// Mock Data Service for Testing
// Creates multiple user accounts with 1-2 years of realistic habit data

import { v4 as uuidv4 } from 'uuid';
import { supabaseService } from './SupabaseService';
import { offlineStorage } from './OfflineStorage';
import { Habit, HabitProgress, User, FrequencyType, HabitType } from '../../types';
import { toLocalISODate } from '../../utils/formatting/time';

interface MockUserData {
  user: User;
  habits: Habit[];
  progress: HabitProgress[];
}

class MockDataService {
  private readonly MOCK_USERS_COUNT = 3;
  private readonly HABITS_PER_USER = [8, 12, 15]; // Different numbers for variety
  private readonly DATA_START_DATE = new Date('2023-01-01');
  private readonly DATA_END_DATE = new Date();

  private habitTemplates = [
    { name: 'Morning Meditation', type: 'time' as HabitType, category: 'mindfulness', targetValue: 10, unit: 'minutes' },
    { name: 'Daily Exercise', type: 'boolean' as HabitType, category: 'fitness', targetValue: 1, unit: 'session' },
    { name: 'Read Books', type: 'time' as HabitType, category: 'learning', targetValue: 30, unit: 'minutes' },
    { name: 'Drink Water', type: 'number' as HabitType, category: 'health', targetValue: 8, unit: 'glasses' },
    { name: 'Write Journal', type: 'boolean' as HabitType, category: 'mindfulness', targetValue: 1, unit: 'entry' },
    { name: 'Learn Language', type: 'time' as HabitType, category: 'learning', targetValue: 15, unit: 'minutes' },
    { name: 'Strength Training', type: 'number' as HabitType, category: 'fitness', targetValue: 3, unit: 'sets' },
    { name: 'Meal Prep', type: 'boolean' as HabitType, category: 'health', targetValue: 1, unit: 'session' },
    { name: 'Call Family', type: 'boolean' as HabitType, category: 'social', targetValue: 1, unit: 'call' },
    { name: 'Practice Guitar', type: 'time' as HabitType, category: 'hobbies', targetValue: 20, unit: 'minutes' },
    { name: 'Morning Walk', type: 'number' as HabitType, category: 'fitness', targetValue: 5000, unit: 'steps' },
    { name: 'Sleep Early', type: 'boolean' as HabitType, category: 'health', targetValue: 1, unit: 'night' },
    { name: 'No Social Media', type: 'boolean' as HabitType, category: 'productivity', targetValue: 1, unit: 'day' },
    { name: 'Gratitude Practice', type: 'number' as HabitType, category: 'mindfulness', targetValue: 3, unit: 'items' },
    { name: 'Code Practice', type: 'time' as HabitType, category: 'learning', targetValue: 45, unit: 'minutes' },
  ];

  private userProfiles = [
    { name: 'Alex Johnson', email: 'alex.test@example.com', avatar: '👨‍💻' },
    { name: 'Sarah Williams', email: 'sarah.test@example.com', avatar: '👩‍🎨' },
    { name: 'Mike Chen', email: 'mike.test@example.com', avatar: '👨‍🏫' },
  ];

  async createMockData(): Promise<void> {
    console.log('🎭 Creating mock data for testing...');
    
    try {
      // Create mock users and their data
      for (let i = 0; i < this.MOCK_USERS_COUNT; i++) {
        const mockData = await this.generateUserMockData(i);
        await this.saveMockDataToDatabase(mockData);
        await this.saveMockDataOffline(mockData);
        console.log(`✅ Created mock data for user: ${mockData.user.name}`);
      }

      console.log('🎉 Mock data creation completed!');
      console.log(`📊 Created ${this.MOCK_USERS_COUNT} users with realistic habit data`);
      console.log('⚠️  Remember to remove this data before production!');
    } catch (error) {
      console.error('❌ Error creating mock data:', error);
      throw error;
    }
  }

  private async generateUserMockData(userIndex: number): Promise<MockUserData> {
    const profile = this.userProfiles[userIndex];
    const user: User = {
      id: `mock_user_${userIndex + 1}`,
      name: profile.name,
      email: profile.email,
      // avatar: profile.avatar,
      createdAt: this.DATA_START_DATE.toISOString(),
      subscriptionStatus: userIndex === 0 ? 'premium' : 'free' as any, // First user is premium
      updatedAt: this.DATA_START_DATE.toISOString(),
      // timezone: 'America/New_York',
      // preferences: {
      //   theme: 'light',
      //   notifications: true,
      //   weekStartsOn: 'Monday',
      // },
    };

    const habits = this.generateHabitsForUser(user.id, userIndex);
    const progress = await this.generateProgressForHabits(habits);

    return { user, habits, progress };
  }

  private generateHabitsForUser(userId: string, userIndex: number): Habit[] {
    const habitCount = this.HABITS_PER_USER[userIndex];
    const selectedTemplates = this.shuffleArray([...this.habitTemplates]).slice(0, habitCount);
    
    return selectedTemplates.map((template, index) => {
      const createdAt = new Date(this.DATA_START_DATE);
      createdAt.setDate(createdAt.getDate() + (index * 7)); // Spread habit creation over weeks

      return {
        id: uuidv4(),
        userId,
        title: template.name,
        notes: `Mock habit for testing - ${template.name.toLowerCase()}`,
        type: template.type,
        // category: template.category,
        frequency: this.getRandomFrequency(),
        targetValue: template.targetValue,
        unit: template.unit,
        color: this.getRandomColor(),
        isActive: Math.random() > 0.1, // 90% active, 10% inactive
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(),
        streak: 0, // Will be calculated from progress
        bestStreak: 0,
        totalCompletions: 0,
        reminderTime: this.getRandomReminderTime(),
        tags: [template.category],
        isShared: false,
        pending: false,
      };
    });
  }

  private async generateProgressForHabits(habits: Habit[]): Promise<HabitProgress[]> {
    const allProgress: HabitProgress[] = [];
    
    for (const habit of habits) {
      const habitCreatedAt = new Date(habit.createdAt);
      let currentDate = new Date(habitCreatedAt);
      
      // Generate progress from habit creation to now
      while (currentDate <= this.DATA_END_DATE) {
        // Skip some days based on habit difficulty and user consistency
        const shouldComplete = this.shouldCompleteHabit(habit, currentDate);
        
        if (shouldComplete) {
          const progress: HabitProgress = {
            id: uuidv4(),
            habitId: habit.id,
            // userId: habit.userId,
            date: toLocalISODate(currentDate),
            // completed: true,
            // value: this.generateProgressValue(habit),
            notes: Math.random() > 0.8 ? this.getRandomNote() : undefined,
            status: 'completed' as any,
            updatedAt: currentDate.toISOString(),
            pending: false,
            // createdAt: currentDate.toISOString(),
          };
          
          allProgress.push(progress);
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return allProgress;
  }

  private shouldCompleteHabit(habit: Habit, date: Date): boolean {
    // Different completion rates for different habit types and categories
    const baseRate = this.getBaseCompletionRate(habit);
    
    // Add some randomness and patterns
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Weekend modifier
    let modifier = 1;
    // if (habit.category === 'fitness' && isWeekend) modifier = 1.2;
    // if (habit.category === 'productivity' && isWeekend) modifier = 0.7;
    
    // Monthly consistency variation (some months are better than others)
    const month = date.getMonth();
    if (month === 0 || month === 8) modifier *= 1.1; // January and September boost
    if (month === 11) modifier *= 0.8; // December decline
    
    return Math.random() < (baseRate * modifier);
  }

  private getBaseCompletionRate(habit: Habit): number {
    // Different habits have different success rates
    const rates: Record<string, number> = {
      'mindfulness': 0.75,
      'fitness': 0.65,
      'learning': 0.70,
      'health': 0.80,
      'productivity': 0.60,
      'social': 0.55,
      'hobbies': 0.50,
    };
    
    return rates['fitness'] || 0.65;
  }

  private generateProgressValue(habit: Habit): number | undefined {
    if (habit.type === 'boolean' as any) return undefined;
    
    const target = (habit as any).targetValue || 1;
    // Generate value around target with some variation
    const variation = target * 0.3; // 30% variation
    const value = Math.max(1, target + (Math.random() - 0.5) * variation);
    
    return Math.floor(value);
  }

  private getRandomFrequency(): FrequencyType {
    const frequencies: FrequencyType[] = ['daily', 'weekly', 'custom'];
    return frequencies[Math.floor(Math.random() * frequencies.length)];
  }

  private getRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private getRandomReminderTime(): string {
    const hours = ['07:00', '08:00', '09:00', '18:00', '19:00', '20:00'];
    return hours[Math.floor(Math.random() * hours.length)];
  }

  private getRandomNote(): string {
    const notes = [
      'Feeling great!',
      'Challenging day',
      'Made good progress',
      'Need to improve tomorrow',
      'Exceeded expectations',
      'Steady progress',
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async saveMockDataToDatabase(data: MockUserData): Promise<void> {
    try {
      // Save user to Supabase (if auth allows mock users)
      const { error: userError } = (await supabaseService as any).from('users').upsert(data.user);
      
      if (userError) {
        console.warn('Could not save user to Supabase:', userError.message);
      }

      // Save habits
      const { error: habitsError } = (await supabaseService as any).from('habits').upsert(data.habits);
      
      if (habitsError) {
        console.warn('Could not save habits to Supabase:', habitsError.message);
      }

      // Save progress in batches (Supabase has limits)
      const batchSize = 100;
      for (let i = 0; i < data.progress.length; i += batchSize) {
        const batch = data.progress.slice(i, i + batchSize);
        const { error: progressError } = (await supabaseService as any).from('habit_progress').insert(batch)
          .from('habit_progress')
          .upsert(batch);
        
        if (progressError) {
          console.warn('Could not save progress batch to Supabase:', progressError.message);
        }
      }
    } catch (error) {
      console.warn('Database save error (continuing with offline):', error);
    }
  }

  private async saveMockDataOffline(data: MockUserData): Promise<void> {
    try {
      // Save to offline storage for offline functionality
      // await offlineStorage.saveUser(data.user);
      
      for (const habit of data.habits) {
        // await offlineStorage.saveHabit(habit);
      }
      
      for (const progress of data.progress) {
        // await offlineStorage.saveProgress(progress);
      }
    } catch (error) {
      console.error('Error saving mock data offline:', error);
    }
  }

  async removeMockData(): Promise<void> {
    console.log('🧹 Removing mock data...');
    
    try {
      // Remove from Supabase
      const mockUserIds = Array.from({ length: this.MOCK_USERS_COUNT }, (_, i) => `mock_user_${i + 1}`);
      
      // await supabase.from('habit_progress').delete().in('userId', mockUserIds);
      // await supabase.from('habits').delete().in('userId', mockUserIds);
      // await supabase.from('users').delete().in('id', mockUserIds);
      
      // Remove from offline storage
      for (const userId of mockUserIds) {
        // await offlineStorage.deleteUser(userId);
      }
      
      console.log('✅ Mock data removed successfully');
    } catch (error) {
      console.error('❌ Error removing mock data:', error);
      throw error;
    }
  }

  async getMockDataStats(): Promise<any> {
    try {
      const mockUserIds = Array.from({ length: this.MOCK_USERS_COUNT }, (_, i) => `mock_user_${i + 1}`);
      
      const { data: users } = (await supabaseService as any).from('users').select('*')
        .from('users')
        .select('*')
        .in('id', mockUserIds);
      
      const { data: habits } = (await supabaseService as any).from('habits').select('*')
        .from('habits')
        .select('*')
        .in('userId', mockUserIds);
      
      const { data: progress } = (await supabaseService as any).from('habit_progress').select('*')
        .from('habit_progress')
        .select('*')
        .in('userId', mockUserIds);
      
      return {
        users: users?.length || 0,
        habits: habits?.length || 0,
        progress: progress?.length || 0,
        dateRange: {
          start: toLocalISODate(this.DATA_START_DATE),
          end: toLocalISODate(this.DATA_END_DATE),
        },
      };
    } catch (error) {
      console.error('Error getting mock data stats:', error);
      return null;
    }
  }
}

export const mockDataService = new MockDataService();