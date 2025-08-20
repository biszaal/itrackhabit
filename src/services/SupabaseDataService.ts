// Supabase-integrated Data Service
// Handles all data operations with Supabase backend and offline support

import { v4 as uuidv4 } from 'uuid';
import { supabase, TABLES, SupabaseHabit, SupabaseHabitProgress, SupabaseUser } from '../config/supabase';
import { offlineStorage } from './OfflineStorage';
import { networkService } from './NetworkService';
import { Habit, HabitProgress, HabitWithStats, DailyStats, FrequencyType, HabitType, User, FriendWithDetails, FriendRequest, Challenge } from '../types';

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

class SupabaseDataService {
  private isInitialized = false;
  private syncInProgress = false;
  private currentUserId = 'default-user';

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing Supabase Data Service...');
      
      // Initialize offline storage first
      await offlineStorage.initialize();
      console.log('✅ Offline storage initialized');
      
      // Initialize network service
      await networkService.initialize();
      console.log('✅ Network service initialized');
      
      // Get current user from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        this.currentUserId = user.id;
        console.log('✅ Authenticated user found:', user.id);
      } else {
        console.log('📱 No authenticated user - using offline mode');
      }
      
      // Create default habits for new users
      await this.createDefaultHabitsIfNeeded();
      
      // Set up auth state listener
      supabase.auth.onAuthStateChange((event, session) => {
        this.handleAuthStateChange(event, session);
      });
      
      // Set up auto-sync when network comes back online
      networkService.addSyncCallback(this.handleNetworkReconnection.bind(this));
      
      // Initial sync check
      await this.performInitialSync();

      this.isInitialized = true;
      console.log('🎉 Supabase Data Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase data service:', error);
      throw error;
    }
  }

  private async createDefaultHabitsIfNeeded(): Promise<void> {
    try {
      // Check if default habits have already been created
      const defaultHabitsCreated = await offlineStorage.getMetadata('default_habits_created');
      
      if (!defaultHabitsCreated) {
        // Double-check by looking at existing habits
        const existingHabits = await offlineStorage.getHabits(this.currentUserId);
        
        if (existingHabits.length === 0) {
          console.log('🆕 New user detected - creating default habits');
          
          const defaultHabits = [
            {
              title: 'Exercise 30 min',
              notes: 'Stay active with 30 minutes of physical activity',
              frequency: 'daily' as FrequencyType,
              isShared: false,
              type: 'manual' as HabitType,
              targetConfig: {
                hasTarget: true,
                targetValue: 30,
                unit: 'minutes',
                isTimeBased: true,
              },
            },
            {
              title: 'Read Book',
              notes: 'Expand your knowledge through daily reading',
              frequency: 'daily' as FrequencyType,
              isShared: false,
              type: 'manual' as HabitType,
              targetConfig: {
                hasTarget: true,
                targetValue: 30,
                unit: 'minutes',
                isTimeBased: true,
              },
            },
            {
              title: 'Drink Water',
              notes: 'Stay hydrated throughout the day',
              frequency: 'daily' as FrequencyType,
              isShared: false,
              type: 'manual' as HabitType,
              targetConfig: {
                hasTarget: true,
                targetValue: 8,
                unit: 'glasses',
                isTimeBased: false,
              },
            },
            {
              title: 'Meditate',
              notes: 'Practice mindfulness and meditation for mental well-being',
              frequency: 'daily' as FrequencyType,
              isShared: false,
              type: 'manual' as HabitType,
              targetConfig: {
                hasTarget: true,
                targetValue: 10,
                unit: 'minutes',
                isTimeBased: true,
              },
            },
          ];

          const now = new Date().toISOString();
          
          for (const habitData of defaultHabits) {
            const habit: Habit = {
              id: uuidv4(),
              userId: this.currentUserId,
              createdAt: now,
              updatedAt: now,
              pending: true, // Mark as pending for sync
              ...habitData,
            };

            await offlineStorage.saveHabit(habit);
            console.log('✅ Created default habit:', habit.title);
          }
          
          // Mark that default habits have been created
          await offlineStorage.setMetadata('default_habits_created', 'true');
          console.log('🎉 Default habits created successfully');
        } else {
          console.log('👤 User has existing habits - skipping default habits');
        }
      } else {
        console.log('👤 Default habits already created - skipping');
      }
    } catch (error) {
      console.error('❌ Failed to create default habits:', error);
    }
  }

  private async handleAuthStateChange(event: string, session: any): Promise<void> {
    console.log('🔐 Auth state changed:', event);
    
    if (event === 'SIGNED_IN' && session?.user) {
      this.currentUserId = session.user.id;
      console.log('✅ User signed in, starting sync...');
      await this.syncToSupabase();
    } else if (event === 'SIGNED_OUT') {
      this.currentUserId = 'default-user';
      console.log('📱 User signed out, switching to offline mode');
    }
  }

  private async handleNetworkReconnection(): Promise<void> {
    console.log('🌐 Network reconnected, attempting sync...');
    await this.syncToSupabase();
  }

  private async performInitialSync(): Promise<void> {
    // Only sync if user is authenticated and online
    if (networkService.getConnectionStatus() && this.currentUserId !== 'default-user') {
      console.log('🔄 Performing initial sync...');
      this.syncToSupabase().catch(error => 
        console.log('Initial sync failed:', error)
      );
    } else {
      console.log('📱 Offline mode - skipping initial sync');
    }
  }

  // ===== HABIT OPERATIONS =====

  async createHabit(habitData: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'pending'>): Promise<Habit> {
    const habit: Habit = {
      id: uuidv4(),
      userId: this.currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pending: true,
      ...habitData,
    };

    // Save to local storage first
    await offlineStorage.saveHabit(habit);
    
    // Try to sync to Supabase if online
    if (networkService.getConnectionStatus() && this.currentUserId !== 'default-user') {
      try {
        await this.syncHabitToSupabase(habit);
      } catch (error) {
        console.log('Failed to sync habit to Supabase, will retry later:', error);
      }
    }

    return habit;
  }

  async updateHabit(habitId: string, updates: Partial<Habit>): Promise<Habit> {
    const existingHabit = await offlineStorage.getHabit(habitId);
    if (!existingHabit) {
      throw new Error('Habit not found');
    }

    const updatedHabit: Habit = {
      ...existingHabit,
      ...updates,
      updatedAt: new Date().toISOString(),
      pending: true,
    };

    // Save to local storage
    await offlineStorage.saveHabit(updatedHabit);
    
    // Try to sync to Supabase if online
    if (networkService.getConnectionStatus() && this.currentUserId !== 'default-user') {
      try {
        await this.syncHabitToSupabase(updatedHabit);
      } catch (error) {
        console.log('Failed to sync habit update to Supabase, will retry later:', error);
      }
    }

    return updatedHabit;
  }

  async deleteHabit(habitId: string): Promise<void> {
    // Soft delete in local storage
    await offlineStorage.deleteHabit(habitId);
    
    // Try to sync deletion to Supabase if online
    if (networkService.getConnectionStatus() && this.currentUserId !== 'default-user') {
      try {
        const { error } = await supabase
          .from(TABLES.HABITS)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', habitId);
        
        if (error) throw error;
      } catch (error) {
        console.log('Failed to sync habit deletion to Supabase, will retry later:', error);
        // Add to sync queue for later
        await offlineStorage.addToSyncQueue('delete', 'habits', { id: habitId });
      }
    }
  }

  async getHabits(): Promise<Habit[]> {
    return offlineStorage.getHabits(this.currentUserId);
  }

  async getHabitsWithStats(): Promise<HabitWithStats[]> {
    const habits = await this.getHabits();
    const habitsWithStats: HabitWithStats[] = [];

    for (const habit of habits) {
      const progress = await offlineStorage.getHabitProgress(habit.id);
      const stats = this.calculateHabitStats(habit, progress);
      
      habitsWithStats.push({
        ...habit,
        ...stats,
      });
    }

    return habitsWithStats;
  }

  // ===== HABIT PROGRESS OPERATIONS =====

  async createHabitProgress(progressData: Omit<HabitProgress, 'id' | 'updatedAt' | 'pending'>): Promise<HabitProgress> {
    const progress: HabitProgress = {
      id: uuidv4(),
      updatedAt: new Date().toISOString(),
      pending: true,
      ...progressData,
    };

    // Save to local storage
    await offlineStorage.saveHabitProgress(progress);
    
    // Try to sync to Supabase if online
    if (networkService.getConnectionStatus() && this.currentUserId !== 'default-user') {
      try {
        await this.syncProgressToSupabase(progress);
      } catch (error) {
        console.log('Failed to sync progress to Supabase, will retry later:', error);
      }
    }

    return progress;
  }

  async updateHabitProgress(progressId: string, updates: Partial<HabitProgress>): Promise<HabitProgress> {
    const existingProgress = await offlineStorage.getHabitProgressById(progressId);
    if (!existingProgress) {
      throw new Error('Progress not found');
    }

    const updatedProgress: HabitProgress = {
      ...existingProgress,
      ...updates,
      updatedAt: new Date().toISOString(),
      pending: true,
    };

    // Save to local storage
    await offlineStorage.saveHabitProgress(updatedProgress);
    
    // Try to sync to Supabase if online
    if (networkService.getConnectionStatus() && this.currentUserId !== 'default-user') {
      try {
        await this.syncProgressToSupabase(updatedProgress);
      } catch (error) {
        console.log('Failed to sync progress update to Supabase, will retry later:', error);
      }
    }

    return updatedProgress;
  }

  async getHabitProgress(habitId: string): Promise<HabitProgress[]> {
    return offlineStorage.getHabitProgress(habitId);
  }

  async getDailyStats(date: string): Promise<DailyStats> {
    const habits = await this.getHabits();
    const completedHabits = [];

    for (const habit of habits) {
      const progress = await offlineStorage.getHabitProgressForDate(habit.id, date);
      if (progress && progress.status === 'done') {
        completedHabits.push(habit);
      }
    }

    return {
      date,
      totalHabits: habits.length,
      completedHabits: completedHabits.length,
      completionRate: habits.length > 0 ? Math.round((completedHabits.length / habits.length) * 100) : 0,
    };
  }

  // ===== SYNC OPERATIONS =====

  async syncToSupabase(): Promise<SyncResult> {
    if (this.syncInProgress || this.currentUserId === 'default-user') {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress or user not authenticated'] };
    }

    this.syncInProgress = true;
    const errors: string[] = [];
    let synced = 0;
    let failed = 0;

    try {
      console.log('🔄 Starting sync to Supabase...');

      // Sync pending habits
      const pendingHabits = await offlineStorage.getPendingHabits(this.currentUserId);
      for (const habit of pendingHabits) {
        try {
          await this.syncHabitToSupabase(habit);
          synced++;
        } catch (error) {
          console.error('Failed to sync habit:', error);
          errors.push(`Habit ${habit.title}: ${error instanceof Error ? error.message : String(error)}`);
          failed++;
        }
      }

      // Sync pending progress
      const pendingProgress = await offlineStorage.getPendingProgress(this.currentUserId);
      for (const progress of pendingProgress) {
        try {
          await this.syncProgressToSupabase(progress);
          synced++;
        } catch (error) {
          console.error('Failed to sync progress:', error);
          errors.push(`Progress ${progress.id}: ${error instanceof Error ? error.message : String(error)}`);
          failed++;
        }
      }

      // Pull latest data from Supabase
      await this.pullDataFromSupabase();

      console.log(`✅ Sync completed: ${synced} synced, ${failed} failed`);
      return { success: true, synced, failed, errors };

    } catch (error) {
      console.error('❌ Sync failed:', error);
      errors.push(`Sync error: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, synced, failed, errors };
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncHabitToSupabase(habit: Habit): Promise<void> {
    const supabaseHabit: Omit<SupabaseHabit, 'created_at' | 'updated_at'> = {
      id: habit.id,
      user_id: habit.userId,
      title: habit.title,
      notes: habit.notes,
      frequency: habit.frequency,
      is_shared: habit.isShared,
      type: habit.type,
      health_config: habit.healthConfig,
      target_config: habit.targetConfig,
      deleted_at: habit.deletedAt,
    };

    const { error } = await supabase
      .from(TABLES.HABITS)
      .upsert(supabaseHabit);

    if (error) throw error;

    // Mark as synced in local storage
    await offlineStorage.saveHabit({ ...habit, pending: false });
  }

  private async syncProgressToSupabase(progress: HabitProgress): Promise<void> {
    const supabaseProgress: Omit<SupabaseHabitProgress, 'created_at' | 'updated_at'> = {
      id: progress.id,
      habit_id: progress.habitId,
      date: progress.date,
      status: progress.status,
      current_value: progress.currentValue,
      target_value: progress.targetValue,
      unit: progress.unit,
      notes: progress.notes,
    };

    const { error } = await supabase
      .from(TABLES.HABIT_PROGRESS)
      .upsert(supabaseProgress);

    if (error) throw error;

    // Mark as synced in local storage
    await offlineStorage.saveHabitProgress({ ...progress, pending: false });
  }

  private async pullDataFromSupabase(): Promise<void> {
    try {
      // Pull habits
      const { data: supabaseHabits, error: habitsError } = await supabase
        .from(TABLES.HABITS)
        .select('*')
        .eq('user_id', this.currentUserId)
        .is('deleted_at', null);

      if (habitsError) throw habitsError;

      // Convert and save habits
      if (supabaseHabits) {
        for (const supabaseHabit of supabaseHabits) {
          const habit: Habit = {
            id: supabaseHabit.id,
            userId: supabaseHabit.user_id,
            title: supabaseHabit.title,
            notes: supabaseHabit.notes,
            frequency: supabaseHabit.frequency as FrequencyType,
            isShared: supabaseHabit.is_shared,
            type: supabaseHabit.type as HabitType,
            healthConfig: supabaseHabit.health_config,
            targetConfig: supabaseHabit.target_config,
            createdAt: supabaseHabit.created_at,
            updatedAt: supabaseHabit.updated_at,
            deletedAt: supabaseHabit.deleted_at,
            pending: false,
          };
          await offlineStorage.saveHabit(habit);
        }
      }

      // Pull progress (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: supabaseProgress, error: progressError } = await supabase
        .from(TABLES.HABIT_PROGRESS)
        .select(`
          *,
          habits!inner(user_id)
        `)
        .eq('habits.user_id', this.currentUserId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (progressError) throw progressError;

      // Convert and save progress
      if (supabaseProgress) {
        for (const supabaseProgressItem of supabaseProgress) {
          const progress: HabitProgress = {
            id: supabaseProgressItem.id,
            habitId: supabaseProgressItem.habit_id,
            date: supabaseProgressItem.date,
            status: supabaseProgressItem.status,
            currentValue: supabaseProgressItem.current_value,
            targetValue: supabaseProgressItem.target_value,
            unit: supabaseProgressItem.unit,
            notes: supabaseProgressItem.notes,
            updatedAt: supabaseProgressItem.updated_at,
            pending: false,
          };
          await offlineStorage.saveHabitProgress(progress);
        }
      }

    } catch (error) {
      console.error('Failed to pull data from Supabase:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====

  private calculateHabitStats(habit: Habit, progress: HabitProgress[]): {
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
    isDoneToday: boolean;
    totalCompletions: number;
  } {
    const today = new Date().toISOString().split('T')[0];
    const completedProgress = progress.filter(p => p.status === 'done');
    
    // Calculate streaks
    const sortedProgress = completedProgress
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const progressDates = new Set(sortedProgress.map(p => p.date));
    
    // Current streak (from today backwards)
    let checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (progressDates.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Longest streak
    for (const progressItem of sortedProgress) {
      const progressDate = new Date(progressItem.date);
      tempStreak++;
      
      // Check if next day exists
      const nextDay = new Date(progressDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      
      if (!progressDates.has(nextDayStr)) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    
    // Completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentProgress = progress.filter(p => new Date(p.date) >= thirtyDaysAgo);
    const completionRate = recentProgress.length > 0 
      ? Math.round((recentProgress.filter(p => p.status === 'done').length / 30) * 100)
      : 0;
    
    return {
      currentStreak,
      longestStreak,
      completionRate,
      isDoneToday: progressDates.has(today),
      totalCompletions: completedProgress.length,
    };
  }

  // ===== NETWORK STATUS =====

  getNetworkStatus(): boolean {
    return networkService.getConnectionStatus();
  }

  async getPendingSyncCount(): Promise<number> {
    const pendingHabits = await offlineStorage.getPendingHabits(this.currentUserId);
    const pendingProgress = await offlineStorage.getPendingProgress(this.currentUserId);
    return pendingHabits.length + pendingProgress.length;
  }

  addNetworkListener(callback: (isConnected: boolean) => void): () => void {
    return networkService.addNetworkListener(callback);
  }

  // ===== COMPATIBILITY METHODS =====

  async markHabitProgress(
    habitId: string, 
    date: string, 
    status: 'done' | 'skip' | 'partial', 
    options?: {
      notes?: string;
      isChallenge?: boolean;
      currentValue?: number;
      targetValue?: number;
      unit?: string;
      timeSpentSeconds?: number;
    }
  ): Promise<HabitProgress> {
    const { notes, currentValue, targetValue, unit } = options || {};
    return this.createHabitProgress({
      habitId,
      date,
      status,
      notes,
      currentValue,
      targetValue,
      unit,
    });
  }

  async updateHabitProgressValue(
    habitId: string, 
    date: string, 
    currentValue: number, 
    status: 'partial' | 'done'
  ): Promise<HabitProgress> {
    // Get habit to determine target and unit
    const habit = await offlineStorage.getHabit(habitId);
    if (!habit) {
      throw new Error('Habit not found');
    }

    const targetValue = habit.healthConfig?.targetValue || habit.targetConfig?.targetValue || 0;
    const unit = habit.healthConfig?.unit || habit.targetConfig?.unit || '';

    // Check if existing progress exists for today
    const existingProgress = await offlineStorage.getHabitProgressForDate(habitId, date);
    
    if (existingProgress) {
      // Update existing progress
      return this.updateHabitProgress(existingProgress.id, {
        currentValue,
        status,
        targetValue,
        unit,
      });
    } else {
      // Create new progress
      return this.createHabitProgress({
        habitId,
        date,
        status,
        currentValue,
        targetValue,
        unit,
      });
    }
  }

  async getHabitProgressForDate(habitId: string, date: string): Promise<HabitProgress | null> {
    return offlineStorage.getHabitProgressForDate(habitId, date);
  }

  // ===== FRIENDS OPERATIONS =====

  async getFriends(): Promise<FriendWithDetails[]> {
    if (!networkService.getConnectionStatus() || this.currentUserId === 'default-user') {
      // Return empty array when offline or not authenticated
      return [];
    }

    try {
      // Get friends from Supabase friends table
      const { data: friendsData, error } = await supabase
        .from('friends')
        .select(`
          id,
          user_id,
          friend_user_id,
          status,
          created_at,
          users!friends_friend_user_id_fkey(
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('user_id', this.currentUserId)
        .eq('status', 'accepted');

      if (error) throw error;

      if (!friendsData) return [];

      // Transform to FriendWithDetails format
      return friendsData.map(friend => ({
        id: friend.id,
        userId: friend.user_id,
        friendUserId: friend.friend_user_id,
        status: 'accepted' as const,
        createdAt: friend.created_at,
        friendName: friend.users?.name || 'Unknown User',
        friendEmail: friend.users?.email || '',
        friendAvatarUrl: friend.users?.avatar_url,
        sharedHabits: [], // TODO: Implement shared habits if needed
      }));
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      return [];
    }
  }

  async getFriendRequests(): Promise<FriendRequest[]> {
    if (!networkService.getConnectionStatus() || this.currentUserId === 'default-user') {
      return [];
    }

    try {
      // Get pending friend requests sent to current user
      const { data: requestsData, error } = await supabase
        .from('friends')
        .select(`
          id,
          user_id,
          friend_user_id,
          status,
          created_at,
          updated_at,
          users!friends_user_id_fkey(
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('friend_user_id', this.currentUserId)
        .eq('status', 'pending');

      if (error) throw error;

      if (!requestsData) return [];

      return requestsData.map(request => ({
        id: request.id,
        fromUserId: request.user_id,
        toUserId: request.friend_user_id,
        status: request.status,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
        user: request.users ? {
          id: request.users.id,
          name: request.users.name,
          email: request.users.email,
          avatarUrl: request.users.avatar_url,
          subscriptionStatus: 'free' as const,
          createdAt: request.created_at,
          updatedAt: request.updated_at,
        } : undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
      return [];
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    if (!networkService.getConnectionStatus() || this.currentUserId === 'default-user' || query.length < 2) {
      return [];
    }

    try {
      const { data: usersData, error } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, created_at, updated_at')
        .neq('id', this.currentUserId)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      if (!usersData) return [];

      return usersData.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url,
        subscriptionStatus: 'free' as const,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      }));
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  // ===== CHALLENGES OPERATIONS =====

  async getActiveChallenges(): Promise<Challenge[]> {
    if (!networkService.getConnectionStatus() || this.currentUserId === 'default-user') {
      return [];
    }

    try {
      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select(`
          id,
          creator_id,
          title,
          description,
          type,
          start_date,
          end_date,
          members,
          created_at,
          updated_at
        `)
        .contains('members', [this.currentUserId])
        .gt('end_date', new Date().toISOString());

      if (error) throw error;

      if (!challengesData) return [];

      return challengesData.map(challenge => ({
        id: challenge.id,
        creatorId: challenge.creator_id,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        startDate: challenge.start_date,
        endDate: challenge.end_date,
        members: challenge.members || [],
        createdAt: challenge.created_at,
        updatedAt: challenge.updated_at,
      }));
    } catch (error) {
      console.error('Failed to fetch active challenges:', error);
      return [];
    }
  }

  async getAvailableChallenges(): Promise<Challenge[]> {
    if (!networkService.getConnectionStatus() || this.currentUserId === 'default-user') {
      return [];
    }

    try {
      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select(`
          id,
          creator_id,
          title,
          description,
          type,
          start_date,
          end_date,
          members,
          created_at,
          updated_at
        `)
        .not('members', 'cs', `{${this.currentUserId}}`)
        .gt('end_date', new Date().toISOString())
        .limit(20);

      if (error) throw error;

      if (!challengesData) return [];

      return challengesData.map(challenge => ({
        id: challenge.id,
        creatorId: challenge.creator_id,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        startDate: challenge.start_date,
        endDate: challenge.end_date,
        members: challenge.members || [],
        createdAt: challenge.created_at,
        updatedAt: challenge.updated_at,
      }));
    } catch (error) {
      console.error('Failed to fetch available challenges:', error);
      return [];
    }
  }

  async joinChallenge(challengeId: string): Promise<void> {
    if (!networkService.getConnectionStatus() || this.currentUserId === 'default-user') {
      throw new Error('Must be online and authenticated to join challenges');
    }

    try {
      // Get current challenge to add user to members array
      const { data: challenge, error: fetchError } = await supabase
        .from('challenges')
        .select('members')
        .eq('id', challengeId)
        .single();

      if (fetchError) throw fetchError;

      const currentMembers = challenge?.members || [];
      if (currentMembers.includes(this.currentUserId)) {
        throw new Error('Already a member of this challenge');
      }

      const { error: updateError } = await supabase
        .from('challenges')
        .update({ members: [...currentMembers, this.currentUserId] })
        .eq('id', challengeId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Failed to join challenge:', error);
      throw error;
    }
  }

  async leaveChallenge(challengeId: string): Promise<void> {
    if (!networkService.getConnectionStatus() || this.currentUserId === 'default-user') {
      throw new Error('Must be online and authenticated to leave challenges');
    }

    try {
      // Get current challenge to remove user from members array
      const { data: challenge, error: fetchError } = await supabase
        .from('challenges')
        .select('members')
        .eq('id', challengeId)
        .single();

      if (fetchError) throw fetchError;

      const currentMembers = challenge?.members || [];
      const updatedMembers = currentMembers.filter(id => id !== this.currentUserId);

      const { error: updateError } = await supabase
        .from('challenges')
        .update({ members: updatedMembers })
        .eq('id', challengeId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Failed to leave challenge:', error);
      throw error;
    }
  }
}

export const supabaseDataService = new SupabaseDataService();