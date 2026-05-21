// Background Health Data Sync Service
// Handles periodic syncing of health data and automatic habit progress updates

import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { autoProgressTracker } from '../core/AutoProgressTracker';
import { healthService } from './HealthService';
import { HabitProgress } from '../../types';

interface SyncResult {
  success: boolean;
  updatedHabits: number;
  newProgress: HabitProgress[];
  errors: string[];
  lastSyncTime: string;
}

class HealthSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private readonly SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
  private readonly LAST_SYNC_KEY = '@itrackhabit_last_health_sync';
  private readonly MAX_SYNC_DAYS = 7; // Don't sync more than 7 days back
  
  private isSyncing = false;
  private onProgressUpdate?: (progress: HabitProgress[]) => void;

  constructor() {
    this.setupAppStateListener();
  }

  // Initialize the sync service
  async initialize(onProgressUpdate?: (progress: HabitProgress[]) => void): Promise<void> {
    this.onProgressUpdate = onProgressUpdate;
    
    // Perform initial sync
    await this.syncHealthData();
    
    // Set up periodic sync
    this.startPeriodicSync();
  }

  // Start periodic background sync
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (AppState.currentState === 'active') {
        await this.syncHealthData();
      }
    }, this.SYNC_INTERVAL_MS);
  }

  // Stop periodic sync
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Set up app state listener for foreground sync
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  // Handle app state changes
  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    if (nextAppState === 'active') {
      // App came to foreground, sync health data
      setTimeout(async () => {
        await this.syncHealthData();
      }, 2000); // Wait 2 seconds to let the app fully load
    }
  }

  // Main sync function
  async syncHealthData(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        updatedHabits: 0,
        newProgress: [],
        errors: ['Sync already in progress'],
        lastSyncTime: new Date().toISOString(),
      };
    }

    this.isSyncing = true;
    const errors: string[] = [];
    let updatedHabits = 0;
    const allNewProgress: HabitProgress[] = [];

    try {
      // Get last sync time
      const lastSyncTime = await this.getLastSyncTime();
      const now = new Date();
      
      // Don't sync if last sync was less than 5 minutes ago (avoid excessive syncing)
      if (lastSyncTime && (now.getTime() - new Date(lastSyncTime).getTime()) < 5 * 60 * 1000) {
        return {
          success: true,
          updatedHabits: 0,
          newProgress: [],
          errors: [],
          lastSyncTime: lastSyncTime,
        };
      }

      console.log('Starting health data sync...');

      // Check all auto-tracked habits for recent progress
      const newProgress = await autoProgressTracker.checkAndUpdateProgress();
      
      if (newProgress.length > 0) {
        updatedHabits = new Set(newProgress.map(p => p.habitId)).size;
        allNewProgress.push(...newProgress);
        
        console.log(`Found ${newProgress.length} new progress entries for ${updatedHabits} habits`);
        
        // Notify callback about new progress
        if (this.onProgressUpdate) {
          this.onProgressUpdate(newProgress);
        }

        // TODO: Sync to backend/cloud storage here
        await this.syncProgressToBackend(newProgress);
      }

      // Perform gap fill for missed days (up to MAX_SYNC_DAYS)
      await this.fillSyncGaps(lastSyncTime || this.getDateDaysAgo(this.MAX_SYNC_DAYS));

      // Update last sync time
      await this.setLastSyncTime(now.toISOString());

      return {
        success: true,
        updatedHabits,
        newProgress: allNewProgress,
        errors,
        lastSyncTime: now.toISOString(),
      };

    } catch (error) {
      console.error('Health sync failed:', error);
      errors.push(`Sync failed: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        updatedHabits,
        newProgress: allNewProgress,
        errors,
        lastSyncTime: new Date().toISOString(),
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // Fill in gaps from missed sync periods
  private async fillSyncGaps(lastSyncTime: string): Promise<void> {
    const lastSync = new Date(lastSyncTime);
    const now = new Date();
    const maxGapDate = new Date();
    maxGapDate.setDate(maxGapDate.getDate() - this.MAX_SYNC_DAYS);

    // Don't fill gaps older than MAX_SYNC_DAYS
    const startDate = lastSync > maxGapDate ? lastSync : maxGapDate;

    if (startDate >= now) {
      return; // No gap to fill
    }

    console.log(`Filling sync gap from ${startDate.toISOString()} to ${now.toISOString()}`);

    const habitIds = autoProgressTracker.getRegisteredHabitIds();
    
    for (const habitId of habitIds) {
      try {
        const gapProgress = await autoProgressTracker.checkProgressForDateRange(
          habitId,
          startDate,
          now
        );

        if (gapProgress.length > 0) {
          console.log(`Found ${gapProgress.length} gap entries for habit ${habitId}`);
          
          // Notify about gap progress
          if (this.onProgressUpdate) {
            this.onProgressUpdate(gapProgress);
          }

          // TODO: Sync gap progress to backend
          await this.syncProgressToBackend(gapProgress);
        }
      } catch (error) {
        console.error(`Failed to fill gap for habit ${habitId}:`, error);
      }
    }
  }

  // Sync progress entries to backend
  private async syncProgressToBackend(progressEntries: HabitProgress[]): Promise<void> {
    // TODO: Implement backend sync
    // This would typically involve:
    // 1. Check if entries already exist in backend
    // 2. Create new entries or update existing ones
    // 3. Handle sync conflicts
    // 4. Update local storage with sync status
    
    console.log(`Syncing ${progressEntries.length} progress entries to backend...`);
    
    // For now, just mark as synced locally
    for (const progress of progressEntries) {
      progress.pending = false; // Mark as synced
    }
  }

  // Force sync for a specific habit
  async forceSyncHabit(habitId: string): Promise<HabitProgress[]> {
    try {
      // Get last 7 days of data for this habit
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const progress = await autoProgressTracker.checkProgressForDateRange(
        habitId,
        startDate,
        endDate
      );

      if (progress.length > 0) {
        await this.syncProgressToBackend(progress);
        
        if (this.onProgressUpdate) {
          this.onProgressUpdate(progress);
        }
      }

      return progress;
    } catch (error) {
      console.error(`Failed to force sync habit ${habitId}:`, error);
      throw error;
    }
  }

  // Get sync status for dashboard
  async getSyncStatus(): Promise<{
    lastSyncTime: string | null;
    registeredHabits: number;
    healthIntegrationAvailable: boolean;
    nextSyncIn: number; // minutes
  }> {
    const lastSyncTime = await this.getLastSyncTime();
    const registeredHabits = autoProgressTracker.getRegisteredHabitIds().length;
    
    // Check health integration
    let healthIntegrationAvailable = false;
    try {
      const status = await healthService.initialize();
      healthIntegrationAvailable = status.isAvailable && status.isAuthorized;
    } catch (error) {
      healthIntegrationAvailable = false;
    }

    // Calculate next sync time
    const nextSyncIn = lastSyncTime 
      ? Math.max(0, this.SYNC_INTERVAL_MS - (Date.now() - new Date(lastSyncTime).getTime())) / 60000
      : 0;

    return {
      lastSyncTime,
      registeredHabits,
      healthIntegrationAvailable,
      nextSyncIn: Math.round(nextSyncIn),
    };
  }

  // Validate health data for all registered habits
  async validateAllHabits(): Promise<{
    habitId: string;
    valid: boolean;
    message: string;
  }[]> {
    const habitIds = autoProgressTracker.getRegisteredHabitIds();
    const results = [];

    for (const habitId of habitIds) {
      const config = autoProgressTracker.getHabitConfig(habitId);
      if (config) {
        const validation = await autoProgressTracker.validateHealthDataAvailability(
          config.metricType
        );
        
        results.push({
          habitId,
          valid: validation.available,
          message: validation.message,
        });
      }
    }

    return results;
  }

  // Get last sync time from storage
  private async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.LAST_SYNC_KEY);
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  // Set last sync time in storage
  private async setLastSyncTime(time: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, time);
    } catch (error) {
      console.error('Failed to set last sync time:', error);
    }
  }

  // Get date N days ago
  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }

  // Cleanup resources
  dispose(): void {
    this.stopPeriodicSync();
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  // Reset sync state (useful for troubleshooting)
  async resetSyncState(): Promise<void> {
    await AsyncStorage.removeItem(this.LAST_SYNC_KEY);
    console.log('Health sync state reset');
  }
}

export const healthSyncService = new HealthSyncService();