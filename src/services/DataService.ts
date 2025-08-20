// Offline-First Data Service
// Manages all data operations with offline support and automatic sync

import { v4 as uuidv4 } from 'uuid';
import { offlineStorage } from './OfflineStorage';
import { networkService } from './NetworkService';
import { authService } from './AuthService';
import { Habit, HabitProgress, HabitWithStats, DailyStats, FrequencyType, HabitType } from '../types';

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

class DataService {
  private isInitialized = false;
  private syncInProgress = false;
  private currentUserId = 'default-user'; // TODO: Get from auth service

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await offlineStorage.initialize();
      await networkService.initialize();
      await authService.initialize();
      
      // Create default habits for new users
      await this.createDefaultHabitsIfNeeded();
      
      // Set up auth state listener for login-based sync
      authService.addAuthListener(this.handleAuthStateChange.bind(this));
      
      // Set up auto-sync when network comes back online
      networkService.addSyncCallback(this.handleNetworkReconnection.bind(this));
      
      // Initial sync check
      await this.performInitialSync();

      this.isInitialized = true;
      console.log('Data service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize data service:', error);
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
          },
          {
            title: 'Meditate 30 min',
            notes: 'Practice mindfulness and meditation for mental well-being',
            frequency: 'daily' as FrequencyType,
            isShared: false,
            type: 'manual' as HabitType,
          },
          {
            title: 'Read Book 30 min',
            notes: 'Expand your knowledge through daily reading',
            frequency: 'daily' as FrequencyType,
            isShared: false,
            type: 'manual' as HabitType,
          },
        ];

        const now = new Date().toISOString();
        
        for (const habitData of defaultHabits) {
          const habit: Habit = {
            id: uuidv4(),
            userId: this.currentUserId,
            createdAt: now,
            updatedAt: now,
            pending: false, // Default habits are not pending sync
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

  private async performInitialSync(): Promise<void> {
    // Only sync if both network and auth conditions are met
    if (networkService.getConnectionStatus() && authService.isAuthenticated()) {
      console.log('🔄 App start sync: Network + Login detected');
      this.syncToServer().catch(error => 
        console.log('Initial sync failed:', error)
      );
    } else {
      console.log('⏸️ Skipping initial sync - Network:', networkService.getConnectionStatus(), 'Auth:', authService.isAuthenticated());
    }
  }

  private async handleAuthStateChange(authState: any): Promise<void> {
    if (authState.isLoggedIn && networkService.getConnectionStatus()) {
      console.log('🔄 Login detected - starting sync');
      // User just logged in, perform full sync
      await this.syncToServer();
    } else if (!authState.isLoggedIn) {
      console.log('🚫 Logout detected - stopping sync');
      // User logged out, we'll work offline only
    }
  }

  private async handleNetworkReconnection(): Promise<void> {
    if (authService.isAuthenticated()) {
      console.log('🔄 Network reconnection + Login - starting sync');
      await this.syncToServer();
    } else {
      console.log('⏸️ Network reconnected but not logged in - no sync');
    }
  }

  // ===== HABIT OPERATIONS =====

  async createHabit(habitData: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'pending'>): Promise<Habit> {
    const now = new Date().toISOString();
    const currentUser = await authService.getCurrentUser();
    
    const habit: Habit = {
      id: uuidv4(),
      userId: currentUser?.id || this.currentUserId,
      createdAt: now,
      updatedAt: now,
      pending: true, // Mark as pending until synced
      ...habitData,
    };

    await offlineStorage.saveHabit(habit);
    
    console.log('📝 Created habit:', habit.title);
    
    // Auto-sync if logged in and online
    if (authService.isAuthenticated() && networkService.getConnectionStatus()) {
      console.log('🔄 Auto-sync: New habit created');
      this.syncToServer().catch(error => 
        console.log('Auto-sync after habit creation failed:', error)
      );
    } else {
      console.log('💾 Saved offline: Will sync when logged in + online');
    }

    return habit;
  }

  async getHabits(): Promise<Habit[]> {
    return offlineStorage.getHabits(this.currentUserId);
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

  async getHabitById(habitId: string): Promise<Habit | null> {
    return offlineStorage.getHabitById(habitId);
  }

  async updateHabit(habitId: string, updates: Partial<Habit>): Promise<Habit | null> {
    const existing = await offlineStorage.getHabitById(habitId);
    if (!existing) throw new Error('Habit not found');

    const updated: Habit = {
      ...existing,
      ...updates,
      id: habitId, // Ensure ID doesn't change
      userId: existing.userId, // Ensure userId doesn't change
      updatedAt: new Date().toISOString(),
      pending: true,
    };

    await offlineStorage.updateHabit(updated);
    console.log('📝 Updated habit:', updated.title);

    // Auto-sync if logged in and online
    if (authService.isAuthenticated() && networkService.getConnectionStatus()) {
      console.log('🔄 Auto-sync: Habit updated');
      this.syncToServer().catch(error => 
        console.log('Auto-sync after habit update failed:', error)
      );
    }

    return updated;
  }

  async deleteHabit(habitId: string): Promise<void> {
    await offlineStorage.deleteHabit(habitId);

    // Try to sync immediately if online
    if (networkService.getConnectionStatus()) {
      this.syncToServer().catch(error => 
        console.log('Immediate sync failed:', error)
      );
    }
  }

  // ===== HABIT PROGRESS OPERATIONS =====

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
    // Ensure DataService is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }
    const now = new Date().toISOString();
    const { notes, isChallenge = false, currentValue, targetValue, unit, timeSpentSeconds } = options || {};
    
    console.log('💾 DataService.markHabitProgress called:', {
      habitId,
      date,
      status,
      currentValue,
      targetValue,
      unit,
      notes
    });
    
    // Check if progress already exists for this date
    const existing = await this.getHabitProgressForDate(habitId, date);
    
    let progress: HabitProgress;
    
    if (existing) {
      // Update existing progress
      progress = {
        ...existing,
        status,
        notes,
        currentValue,
        targetValue,
        unit,
        updatedAt: now,
        pending: true,
      };

      await offlineStorage.updateHabitProgress(progress);
      console.log('📈 Updated progress:', habitId, status);
    } else {
      // Create new progress
      progress = {
        id: uuidv4(),
        habitId,
        date,
        status,
        notes,
        currentValue,
        targetValue,
        unit,
        updatedAt: now,
        pending: true,
      };

      await offlineStorage.saveHabitProgress(progress);
      console.log('📈 Marked progress:', habitId, status);
    }
    
    // Handle real-time challenge updates
    if (isChallenge && authService.isAuthenticated() && networkService.getConnectionStatus()) {
      console.log('🏆 Challenge progress - triggering real-time sync');
      // For challenges, sync immediately and emit real-time events
      await this.syncProgressWithRealTimeUpdate(progress);
    } else if (authService.isAuthenticated() && networkService.getConnectionStatus()) {
      console.log('🔄 Auto-sync: Progress marked');
      this.syncToServer().catch(error => 
        console.log('Auto-sync after progress update failed:', error)
      );
    } else {
      console.log('💾 Progress saved offline: Will sync when logged in + online');
    }

    return progress;
  }

  private async syncProgressWithRealTimeUpdate(progress: HabitProgress): Promise<void> {
    try {
      // Sync to server immediately
      await this.syncToServer();
      
      // Emit real-time event for challenge leaderboards
      await this.emitChallengeProgressEvent(progress);
      
      console.log('⚡ Real-time challenge update sent');
    } catch (error) {
      console.error('Real-time challenge sync failed:', error);
    }
  }

  private async emitChallengeProgressEvent(progress: HabitProgress): Promise<void> {
    // TODO: Emit WebSocket/real-time event for challenge updates
    // This will update leaderboards instantly for all participants
    const currentUser = await authService.getCurrentUser();
    console.log('⚡ Emitting challenge progress event:', {
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
    console.log('🔍 DataService.getHabitProgressForDate called:', { habitId, date });
    const progress = await offlineStorage.getHabitProgressForDate(habitId, date);
    console.log('📋 Found progress:', progress);
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
    const habits = await this.getHabits();
    const dailyStats: DailyStats[] = [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateString = currentDate.toISOString().split('T')[0];
      
      let completedHabits = 0;
      const totalHabits = habits.length;

      for (const habit of habits) {
        const progress = await this.getHabitProgressForDate(habit.id, dateString);
        if (progress && progress.status === 'done') {
          completedHabits++;
        }
      }

      const completionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

      dailyStats.push({
        date: dateString,
        totalHabits,
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
      console.log('⏸️ Sync already in progress, skipping');
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    if (!networkService.getConnectionStatus() || !authService.isAuthenticated()) {
      console.log('⏸️ Skipping sync - Network:', networkService.getConnectionStatus(), 'Auth:', authService.isAuthenticated());
      return { success: false, synced: 0, failed: 0, errors: ['Not authenticated or no network'] };
    }

    this.syncInProgress = true;
    console.log('🔄 Starting bidirectional sync...');

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Step 1: Get last sync timestamp
      const lastSyncTime = await offlineStorage.getMetadata('last_sync');
      console.log('📅 Last sync:', lastSyncTime || 'Never');

      // Step 2: Upload local changes (sync queue)
      const uploadResult = await this.uploadLocalChanges();
      result.synced += uploadResult.synced;
      result.failed += uploadResult.failed;
      result.errors.push(...uploadResult.errors);

      // Step 3: Download cloud updates
      const downloadResult = await this.downloadCloudUpdates(lastSyncTime);
      result.synced += downloadResult.synced;
      result.failed += downloadResult.failed;
      result.errors.push(...downloadResult.errors);

      // Step 4: Update last sync timestamp
      await offlineStorage.setMetadata('last_sync', new Date().toISOString());
      
      console.log('✅ Sync completed:', result);
    } catch (error) {
      console.error('❌ Sync failed:', error);
      result.success = false;
      result.errors.push(`Sync failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  private async uploadLocalChanges(): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };
    
    try {
      const syncQueue = await offlineStorage.getSyncQueue();
      console.log(`⬆️ Uploading ${syncQueue.length} local changes`);

      for (const item of syncQueue) {
        try {
          // TODO: Replace with actual AWS API calls
          await this.mockCloudUpload(item);
          
          await offlineStorage.removeSyncQueueItem(item.id);
          result.synced++;
          
          console.log(`⬆️ Uploaded ${item.action} ${item.table}:`, item.data.id || item.data.title);
        } catch (error) {
          console.error(`❌ Failed to upload ${item.action} ${item.table}:`, error);
          
          await offlineStorage.updateSyncQueueItemRetry(item.id);
          result.failed++;
          result.errors.push(`Upload ${item.action} ${item.table}: ${error instanceof Error ? error.message : String(error)}`);
          
          // Remove items with too many retries
          if (item.retryCount >= 3) {
            console.warn(`🗑️ Removing item after ${item.retryCount} failed attempts:`, item.id);
            await offlineStorage.removeSyncQueueItem(item.id);
          }
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  private async downloadCloudUpdates(lastSyncTime: string | null): Promise<SyncResult> {
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };
    
    try {
      console.log('⬇️ Downloading cloud updates since:', lastSyncTime || 'beginning');
      
      // TODO: Replace with actual AWS API calls
      const cloudUpdates = await this.mockCloudDownload(lastSyncTime);
      
      for (const update of cloudUpdates) {
        try {
          // Apply conflict resolution (latest timestamp wins)
          const applied = await this.applyCloudUpdate(update);
          if (applied) {
            result.synced++;
            console.log(`⬇️ Applied cloud update:`, update.type, update.id);
          }
        } catch (error) {
          console.error(`❌ Failed to apply cloud update:`, error);
          result.failed++;
          result.errors.push(`Apply update: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Download failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  private async applyCloudUpdate(cloudData: any): Promise<boolean> {
    try {
      const localData = await this.getLocalDataById(cloudData.type, cloudData.id);
      
      if (!localData) {
        // New item from cloud, save it
        await this.saveCloudDataLocally(cloudData);
        return true;
      }

      // Conflict resolution: latest timestamp wins
      const cloudTime = new Date(cloudData.updatedAt).getTime();
      const localTime = new Date(localData.updatedAt).getTime();
      
      if (cloudTime > localTime) {
        console.log('🏆 Cloud wins conflict resolution:', cloudData.id);
        await this.saveCloudDataLocally(cloudData);
        return true;
      } else {
        console.log('🏆 Local wins conflict resolution:', cloudData.id);
        // Local is newer, keep local data
        return false;
      }
    } catch (error) {
      console.error('❌ Conflict resolution failed:', error);
      return false;
    }
  }

  // Mock methods - replace with actual AWS API calls later
  private async mockCloudUpload(item: any): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (Math.random() < 0.03) throw new Error('Mock upload error');
    console.log(`🔄 Mock upload: ${item.action} ${item.table}`);
  }

  private async mockCloudDownload(lastSyncTime: string | null): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    // Return empty array for now - will be replaced with actual AWS calls
    return [];
  }

  private async getLocalDataById(type: string, id: string): Promise<any> {
    switch (type) {
      case 'habit':
        return await offlineStorage.getHabitById(id);
      case 'progress':
        // TODO: Add method to get progress by ID
        return null;
      default:
        return null;
    }
  }

  private async saveCloudDataLocally(cloudData: any): Promise<void> {
    switch (cloudData.type) {
      case 'habit':
        await offlineStorage.saveHabit(cloudData);
        break;
      case 'progress':
        await offlineStorage.saveHabitProgress(cloudData);
        break;
    }
  }

  async getLastSyncTime(): Promise<string | null> {
    return offlineStorage.getMetadata('last_sync');
  }

  async getPendingSyncCount(): Promise<number> {
    const queue = await offlineStorage.getSyncQueue();
    return queue.length;
  }

  // ===== UTILITY OPERATIONS =====

  async getStorageStats() {
    return offlineStorage.getStats();
  }

  async clearAllLocalData(): Promise<void> {
    await offlineStorage.clearAllData();
  }

  getNetworkStatus(): boolean {
    return networkService.getConnectionStatus();
  }

  addNetworkListener(callback: (connected: boolean) => void): () => void {
    return networkService.addNetworkListener(callback);
  }
}

export const dataService = new DataService();