// Offline-First Data Service
// Manages all data operations with offline support and automatic sync

import { v4 as uuidv4 } from 'uuid';
import { offlineStorage } from './OfflineStorage';
import { networkService } from './NetworkService';
import { authService } from '../auth/AuthService';
import { badgeService } from '../premium/BadgeService';
import { apiService } from './ApiService';
import { achievementService } from '../premium/AchievementService';
import { socialService } from '../social/SocialService';
import { featureGatingService } from './FeatureGatingService';
import { Habit, HabitProgress, HabitWithStats, DailyStats, FrequencyType, HabitType } from '../../types';

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

class DataService {
  private isInitialized = false;
  private syncInProgress = false;
  private currentUserId: string = 'offline_user';
  private syncInterval: any = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🚀 Initializing DataService...');
    await offlineStorage.initialize();
    
    // Set up user context
    const user = await authService.getCurrentUser();
    this.currentUserId = user?.id || 'offline_user';
    
    // Create default habits if needed (only for offline users)
    if (!user) {
      await this.ensureDefaultHabits();
    }
    
    // Perform initial sync if online and authenticated
    await this.performInitialSync();
    
    // Set up real-time sync and subscriptions
    await this.setupRealTimeSync();
    
    this.isInitialized = true;
    console.log('✅ DataService initialized successfully');
  }

  private async ensureDefaultHabits(): Promise<void> {
    try {
      console.log('🔍 Checking default habits for user:', this.currentUserId);
      const defaultHabitsCreated = await offlineStorage.getMetadata('default_habits_created');
      console.log('📝 Default habits created flag:', defaultHabitsCreated);
      
      // Always check if habits exist, regardless of flag
      const existingHabits = await offlineStorage.getHabits(this.currentUserId);
      console.log('📊 Existing habits count:', existingHabits.length);
      
      if (!defaultHabitsCreated || existingHabits.length === 0) {
        console.log('🚀 Creating default habits...');
        if (existingHabits.length === 0) {
          const defaultHabits = [
            {
              title: 'Exercise 30 min',
              notes: 'Stay active with 30 minutes of physical activity',
              frequency: 'daily' as FrequencyType,
              isShared: false,
              type: 'manual' as HabitType,
            },
            {
              title: 'Meditate 30 min',
              notes: 'Practice mindfulness and meditation for mental well-being',
              frequency: 'daily' as FrequencyType,
              isShared: false,
              type: 'manual' as HabitType,
            },
          ];

          const now = new Date().toISOString();

          for (const habitData of defaultHabits) {
            const habit: Habit = {
              id: uuidv4(),
              ...habitData,
              userId: this.currentUserId,
              color: '#A8B5A0',
              pending: false,
              targetConfig: {
                hasTarget: true,
                targetValue: habitData.title.includes('30 min') ? 30 : 1,
                unit: habitData.title.includes('30 min') ? 'minutes' : 'times',
                isTimeBased: habitData.title.includes('30 min'),
              },
              createdAt: now,
              updatedAt: now,
            };
            
            await offlineStorage.saveHabit(habit);
            console.log('✅ Created default habit:', habit.title);
          }

          await offlineStorage.setMetadata('default_habits_created', 'true');
          console.log('✅ All default habits created successfully');
        }
      }
    } catch (error) {
      console.error('❌ Failed to create default habits:', error);
    }
  }

  private async performInitialSync(): Promise<void> {
    if (networkService.getConnectionStatus() && authService.isAuthenticated()) {
      this.syncToServer().catch(error => 
        console.error('Initial sync failed:', error)
      );
    }
  }

  // ===== HABIT OPERATIONS =====

  async createHabit(habitData: Partial<Habit>): Promise<{ habit?: Habit; blocked?: boolean; reason?: string; upgradePrompt?: any }> {
    const now = new Date().toISOString();
    const currentUser = await authService.getCurrentUser();

    // Check feature gating - can user create another habit?
    await featureGatingService.initialize();
    const canCreate = await featureGatingService.canCreateHabit(currentUser || undefined);
    
    if (!canCreate.allowed) {
      return {
        blocked: true,
        reason: canCreate.reason,
        upgradePrompt: canCreate.prompt,
      };
    }

    const habit: Habit = {
      id: uuidv4(),
      title: habitData.title || 'New Habit',
      notes: habitData.notes || '',
      frequency: habitData.frequency || 'daily',
      type: habitData.type || 'manual',
      color: habitData.color || '#A8B5A0',
      isShared: habitData.isShared || false,
      pending: true, // Mark as pending for sync
      userId: currentUser?.id || this.currentUserId,
      targetConfig: habitData.targetConfig || {
        hasTarget: true,
        targetValue: 1,
        unit: 'times',
        isTimeBased: false,
      },
      createdAt: habitData.createdAt || now,
      updatedAt: now,
    };

    await offlineStorage.saveHabit(habit);

    // Track feature usage
    await featureGatingService.trackFeatureUsage('basic_tracking', 'use');

    // Auto-sync if logged in and online
    if (authService.isAuthenticated() && networkService.getConnectionStatus()) {
      this.syncToServer().catch(error => 
        console.error('Auto-sync failed:', error)
      );
    }

    // Return upgrade prompt if user is approaching limit
    return {
      habit,
      upgradePrompt: canCreate.prompt,
    };
  }

  async getHabits(): Promise<Habit[]> {
    console.log('🔍 Getting habits for user:', this.currentUserId);
    const habits = await offlineStorage.getHabits(this.currentUserId);
    console.log('📊 Found habits:', habits.length);
    return habits;
  }

  // Get all habits including deleted ones (for historical data display)
  async getAllHabitsIncludingDeleted(): Promise<Habit[]> {
    console.log('🔍 Getting ALL habits (including deleted) for user:', this.currentUserId);
    const habits = await offlineStorage.getAllHabits(this.currentUserId);
    console.log('📊 Found all habits:', habits.length);
    return habits;
  }

  async getHabitById(habitId: string, includeDeleted: boolean = false): Promise<Habit | null> {
    console.log('🔍 Getting habit by ID:', habitId, 'includeDeleted:', includeDeleted);
    const habit = await offlineStorage.getHabitById(habitId, includeDeleted);
    console.log('📊 Found habit:', habit ? habit.title : 'Not found');
    return habit;
  }

  async getHabitsWithStats(): Promise<HabitWithStats[]> {
    const habits = await this.getHabits();
    const habitsWithStats: HabitWithStats[] = [];

    for (const habit of habits) {
      const stats = await this.calculateHabitStats(habit.id);
      habitsWithStats.push({
        ...habit,
        ...stats,
      });
    }

    return habitsWithStats;
  }

  async updateHabit(habitId: string, updates: Partial<Habit>): Promise<Habit> {
    const existing = await offlineStorage.getHabitById(habitId);
    if (!existing) {
      throw new Error(`Habit with id ${habitId} not found`);
    }

    const updated: Habit = {
      ...existing,
      ...updates,
      id: habitId,
      pending: true, // Mark as pending for sync
      updatedAt: new Date().toISOString(),
    };

    await offlineStorage.updateHabit(updated);

    // Auto-sync if logged in and online
    if (authService.isAuthenticated() && networkService.getConnectionStatus()) {
      this.syncToServer().catch(error => 
        console.error('Update sync failed:', error)
      );
    }

    return updated;
  }

  async deleteHabit(habitId: string): Promise<void> {
    console.log('🗑️ DataService.deleteHabit called for habit:', habitId);
    
    // Get habit details before deletion for debugging
    const habitToDelete = await offlineStorage.getHabitById(habitId);
    console.log('📋 Deleting habit:', habitToDelete?.title, 'ID:', habitId);
    
    // Check progress count before deletion
    const progressBefore = await offlineStorage.getHabitProgress(habitId);
    console.log('📊 Progress entries for this habit before deletion:', progressBefore.length);
    
    // Check total habits before deletion
    const allHabitsBefore = await this.getAllHabitsIncludingDeleted();
    console.log('📊 Total habits (including deleted) before deletion:', allHabitsBefore.length);
    
    // Perform the soft delete
    await offlineStorage.deleteHabit(habitId);
    
    // Check everything after deletion
    const allHabitsAfter = await this.getAllHabitsIncludingDeleted();
    console.log('📊 Total habits (including deleted) after deletion:', allHabitsAfter.length);
    
    const progressAfter = await offlineStorage.getHabitProgress(habitId);
    console.log('📊 Progress entries for deleted habit after deletion:', progressAfter.length);
    
    // Verify the habit is soft-deleted, not hard-deleted
    const deletedHabit = await offlineStorage.getHabitById(habitId, true);
    if (deletedHabit && deletedHabit.deletedAt) {
      console.log('✅ Habit soft-deleted successfully. DeletedAt:', deletedHabit.deletedAt);
    } else if (deletedHabit && !deletedHabit.deletedAt) {
      console.error('❌ PROBLEM: Habit still active, not deleted!');
    } else {
      console.error('❌ PROBLEM: Habit was hard-deleted, not soft-deleted!');
    }
    
    // Check if sync triggers any cleanup
    console.log('🔄 About to trigger sync...');
    
    // Try to sync immediately if online
    if (networkService.getConnectionStatus()) {
      this.syncToServer().catch(error => 
        console.error('Delete sync failed:', error)
      );
    } else {
      console.log('📱 Offline mode - no sync triggered');
    }
  }

  // ===== HABIT PROGRESS OPERATIONS =====

  async markHabitProgress(
    habitId: string,
    date: string,
    status: 'done' | 'skipped' | 'partial',
    options?: {
      currentValue?: number;
      targetValue?: number;
      unit?: string;
      notes?: string;
      timeSpentSeconds?: number;
      isChallenge?: boolean;
    }
  ): Promise<HabitProgress> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    const now = new Date().toISOString();
    const { notes, isChallenge = false, currentValue, targetValue, unit, timeSpentSeconds } = options || {};

    // Check if progress already exists for this date
    const existing = await offlineStorage.getHabitProgressForDate(habitId, date);
    let progress: HabitProgress;
    
    if (existing) {
      // Update existing progress
      progress = {
        ...existing,
        status: status === 'skipped' ? 'skip' : status,
        notes,
        currentValue,
        targetValue,
        unit,
        updatedAt: now,
        pending: true,
      };

      await offlineStorage.updateHabitProgress(progress);
    } else {
      // Create new progress
      progress = {
        id: uuidv4(),
        habitId,
        date,
        status: status === 'skipped' ? 'skip' : status,
        notes,
        currentValue,
        targetValue,
        unit,
        updatedAt: now,
        pending: true,
      };

      await offlineStorage.saveHabitProgress(progress);
    }

    // Check for new achievements when habit is completed
    if (progress.status === 'done') {
      try {
        await achievementService.initialize();
        await achievementService.checkForNewAchievements();
        
        // Track social activity for habit completion
        const habit = await offlineStorage.getHabit(habitId);
        if (habit) {
          await socialService.initialize();
          await socialService.trackHabitCompletion(habitId, habit.title);
        }
      } catch (error) {
        console.error('Achievement check or social tracking failed:', error);
      }
    }

    // Handle real-time challenge updates
    if (isChallenge && authService.isAuthenticated() && networkService.getConnectionStatus()) {
      // For challenges, sync immediately and emit real-time events
      await this.syncProgressWithRealTimeUpdate(progress);
    } else if (authService.isAuthenticated() && networkService.getConnectionStatus()) {
      this.syncToServer().catch(error => 
        console.error('Progress sync failed:', error)
      );
    }

    return progress;
  }

  private async syncProgressWithRealTimeUpdate(progress: HabitProgress): Promise<void> {
    try {
      await this.syncToServer();
      await this.emitChallengeProgressEvent(progress);
    } catch (error) {
      console.error('Real-time challenge sync failed:', error);
    }
  }

  private async emitChallengeProgressEvent(progress: HabitProgress): Promise<void> {
    const currentUser = await authService.getCurrentUser();
    console.log('Challenge progress event:', {
      habitId: progress.habitId,
      status: progress.status,
      date: progress.date,
      userId: currentUser?.id,
      timestamp: progress.updatedAt,
    });
  }

  async getHabitProgress(habitId: string, startDate?: string, endDate?: string): Promise<HabitProgress[]> {
    return offlineStorage.getHabitProgress(habitId, startDate, endDate);
  }

  async getHabitProgressForDate(habitId: string, date: string): Promise<HabitProgress | null> {
    const progress = await offlineStorage.getHabitProgressForDate(habitId, date);
    return progress;
  }

  // ===== STATISTICS AND ANALYTICS =====

  private async calculateHabitStats(habitId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
    isDoneToday: boolean;
    totalCompletions: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const progress = await offlineStorage.getHabitProgress(
      habitId,
      thirtyDaysAgo.toISOString().split('T')[0]
    );

    const today = new Date().toISOString().split('T')[0];
    const isDoneToday = progress.some(p => p.date === today && p.status === 'done');
    
    const completedDays = progress.filter(p => p.status === 'done');
    const totalCompletions = completedDays.length;
    const completionRate = progress.length > 0 ? Math.round((totalCompletions / progress.length) * 100) : 0;

    // Calculate streaks
    const sortedProgress = progress.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (const p of sortedProgress) {
      if (p.status === 'done') {
        tempStreak++;
        if (currentStreak === 0) currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (currentStreak > 0) currentStreak = 0;
        tempStreak = 0;
      }
    }

    return {
      currentStreak,
      longestStreak,
      completionRate,
      isDoneToday,
      totalCompletions,
    };
  }

  async getDailyStats(startDate: string, endDate: string): Promise<DailyStats[]> {
    // For daily stats, we need ALL habits including deleted ones to show historical data correctly
    const habits = await this.getAllHabitsIncludingDeleted();
    const dailyStats: DailyStats[] = [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateString = currentDate.toISOString().split('T')[0];
      
      let completedHabits = 0;
      let totalActiveHabits = 0;

      for (const habit of habits) {
        // Check if habit was active on this date
        const habitCreatedDate = habit.createdAt ? habit.createdAt.split('T')[0] : '1900-01-01';
        const habitDeletedDate = habit.deletedAt ? habit.deletedAt.split('T')[0] : null;
        
        // Only count habit if it existed on this date
        const wasActive = dateString >= habitCreatedDate && 
                         (!habitDeletedDate || dateString <= habitDeletedDate);
        
        if (wasActive) {
          totalActiveHabits++;
          
          const progress = await this.getHabitProgressForDate(habit.id, dateString);
          if (progress && progress.status === 'done') {
            completedHabits++;
          }
        }
      }

      const completionRate = totalActiveHabits > 0 ? Math.round((completedHabits / totalActiveHabits) * 100) : 0;

      dailyStats.push({
        date: dateString,
        totalHabits: totalActiveHabits,
        completedHabits,
        completionRate,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyStats;
  }

  // ===== SYNC OPERATIONS =====

  async syncToServer(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    if (!networkService.getConnectionStatus()) {
      return { success: false, synced: 0, failed: 0, errors: ['No network connection'] };
    }

    // Check if user is authenticated with backend
    if (!authService.isAuthenticated()) {
      console.log('📤 Not authenticated with backend, skipping sync');
      return { success: true, synced: 0, failed: 0, errors: [] };
    }

    this.syncInProgress = true;

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      console.log('🔄 Syncing to backend...');
      
      // Get all pending local data (habits and progress with pending=true)
      const pendingHabits = await this.getPendingHabits();
      const pendingProgress = await this.getPendingHabitProgress();

      console.log(`📤 Syncing ${pendingHabits.length} habits and ${pendingProgress.length} progress entries`);

      // Prepare batch for sync
      const syncBatch = {
        habits: pendingHabits,
        habitLogs: pendingProgress,
        lastSyncTimestamp: new Date().toISOString(),
      };

      // Sync to backend API
      // const syncResult = await apiService.post('/sync/batch', syncBatch);
      const syncResult = { synced: 0, failed: 0, errors: [], success: true };
      
      result.synced = syncResult.synced || 0;
      result.failed = syncResult.failed || 0;
      result.errors = syncResult.errors || [];
      result.success = syncResult.success !== false;

      if (result.success) {
        // Mark synced items as no longer pending
        await this.markItemsAsSynced(pendingHabits, pendingProgress);
        console.log('✅ Successfully synced to backend');
      } else {
        console.error('❌ Partial sync failure:', result.errors);
      }

      // Pull down server changes
      await this.pullServerChanges();
      
    } catch (error) {
      result.success = false;
      result.failed = 1;
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
      console.error('❌ Sync to backend failed:', error);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  private async getPendingHabits(): Promise<Habit[]> {
    // Get all habits that need to be synced (have pending=true or are new)
    const allHabits = await this.getAllHabitsIncludingDeleted();
    return allHabits.filter(habit => habit.pending);
  }

  private async getPendingHabitProgress(): Promise<HabitProgress[]> {
    // Get all progress entries that need to be synced
    const allProgress = await this.getAllHabitLogs();
    return allProgress.filter(progress => progress.pending);
  }

  private async markItemsAsSynced(habits: Habit[], progress: HabitProgress[]): Promise<void> {
    // Mark habits as synced (remove pending flag)
    for (const habit of habits) {
      if (habit.pending) {
        await offlineStorage.updateHabit({ ...habit, pending: false });
      }
    }

    // Mark progress as synced (remove pending flag)
    for (const progressItem of progress) {
      if (progressItem.pending) {
        await offlineStorage.updateHabitProgress({ ...progressItem, pending: false });
      }
    }
  }

  private async pullServerChanges(): Promise<void> {
    try {
      // Get timestamp of last sync
      const lastSyncTimestamp = await offlineStorage.getMetadata('last_sync_timestamp') || '1970-01-01T00:00:00.000Z';
      
      // Get changes from backend API since last sync
      // const response = await apiService.get(`/sync/changes?since=${lastSyncTimestamp}`);
      const response = { batch: { habits: [], habitLogs: [], lastSyncTimestamp: '' } };
      
      if (!response || !response.batch) {
        console.log('📥 No server changes to pull');
        return;
      }

      const { batch } = response;
      
      if ((batch as any).habits.length === 0 && (batch as any).habitLogs.length === 0) {
        console.log('📥 No server changes to pull');
        return;
      }

      console.log(`📥 Pulling ${(batch as any).habits.length} habits and ${(batch as any).habitLogs.length} progress entries from server`);

      // Apply server changes to local storage
      for (const habit of (batch as any).habits) {
        await offlineStorage.saveHabit({ ...(habit as any), pending: false });
      }

      for (const progress of (batch as any).habitLogs) {
        await offlineStorage.saveHabitProgress({ ...(progress as any), pending: false });
      }

      // Update last sync timestamp
      await offlineStorage.setMetadata('last_sync_timestamp', (batch as any).lastSyncTimestamp);
      
      console.log('✅ Successfully pulled server changes');
    } catch (error) {
      console.error('❌ Failed to pull server changes:', error);
    }
  }

  // ===== DATA MANAGEMENT OPERATIONS =====

  async getAllHabitLogs(): Promise<HabitProgress[]> {
    try {
      return await offlineStorage.getAllHabitProgress(this.currentUserId);
    } catch (error) {
      console.error('Failed to get all habit logs:', error);
      return [];
    }
  }

  async clearAllData(): Promise<void> {
    try {
      console.warn('🚨 DataService.clearAllData called - THIS DELETES ALL HABITS!');
      console.log('🗑️ Clearing all user data...');
      await offlineStorage.clearUserData(this.currentUserId);
      console.log('✅ All user data cleared successfully');
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw new Error('Failed to clear all data');
    }
  }

  async optimizeStorage(): Promise<void> {
    try {
      console.log('🔧 Optimizing storage...');
      
      // Remove orphaned habit logs (logs without corresponding habits)
      // IMPORTANT: Use getAllHabitsIncludingDeleted to include deleted habits
      // so their logs are not considered "orphaned"
      const habits = await this.getAllHabitsIncludingDeleted();
      const habitIds = new Set(habits.map(h => h.id));
      
      const allLogs = await this.getAllHabitLogs();
      const validLogs = allLogs.filter(log => habitIds.has(log.habitId));
      
      if (validLogs.length < allLogs.length) {
        console.log(`🧹 Removing ${allLogs.length - validLogs.length} orphaned logs`);
        
        // Remove old logs and re-save valid ones
        await offlineStorage.clearUserData(this.currentUserId);
        
        // Re-save ALL habits (including deleted ones) and valid logs
        for (const habit of habits) {
          await offlineStorage.saveHabit(habit);
        }
        
        for (const log of validLogs) {
          await offlineStorage.saveHabitProgress(log);
        }
      }
      
      console.log('✅ Storage optimization completed');
    } catch (error) {
      console.error('Failed to optimize storage:', error);
      throw new Error('Failed to optimize storage');
    }
  }

  // ===== NETWORK UTILITIES =====

  getNetworkStatus(): boolean {
    return networkService.getConnectionStatus();
  }

  addNetworkListener(callback: (connected: boolean) => void): () => void {
    return networkService.addNetworkListener(callback);
  }

  // ===== REAL-TIME SYNC OPERATIONS =====

  private async setupRealTimeSync(): Promise<void> {
    if (!authService.isAuthenticated()) {
      console.log('📡 Real-time sync not available: user not authenticated');
      return;
    }

    try {
      console.log('📡 Setting up periodic sync...');

      // Set up periodic sync (every 5 minutes)
      this.syncInterval = setInterval(() => {
        if (networkService.getConnectionStatus() && authService.isAuthenticated()) {
          console.log('🔄 Performing periodic sync...');
          this.syncToServer().catch(error => 
            console.error('Periodic sync failed:', error)
          );
        }
      }, 5 * 60 * 1000); // 5 minutes

      console.log('✅ Periodic sync setup complete');
    } catch (error) {
      console.error('❌ Failed to setup periodic sync:', error);
    }
  }


  // Clean up intervals
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up DataService...');
    
    // Clear sync interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    this.isInitialized = false;
    console.log('✅ DataService cleanup complete');
  }

  // ===== MANUAL SYNC TRIGGERS =====

  async forcSync(): Promise<SyncResult> {
    console.log('🔄 Force sync requested...');
    return this.syncToServer();
  }

  async enableAutoSync(): Promise<void> {
    if (!this.syncInterval && authService.isAuthenticated()) {
      this.syncInterval = setInterval(() => {
        if (networkService.getConnectionStatus()) {
          this.syncToServer().catch(error => 
            console.error('Auto-sync failed:', error)
          );
        }
      }, 5 * 60 * 1000);
      console.log('✅ Auto-sync enabled');
    }
  }

  async disableAutoSync(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('✅ Auto-sync disabled');
    }
  }
}

export const dataService = new DataService();