// Conflict Resolution Service
// Handles data conflicts when syncing between local and server data

import { Habit, HabitProgress } from '../../types';

export interface ConflictResolution {
  strategy: 'local_wins' | 'server_wins' | 'merge' | 'user_choice';
  resolvedData?: any;
  needsUserInput?: boolean;
}

export interface DataConflict {
  id: string;
  type: 'habit' | 'progress';
  localData: any;
  serverData: any;
  conflictFields: string[];
  timestamp: string;
}

class ConflictResolverService {
  private pendingConflicts: DataConflict[] = [];
  private conflictCallbacks: Array<(conflict: DataConflict) => void> = [];

  // ===== HABIT CONFLICTS =====

  resolveHabitConflict(localHabit: Habit, serverHabit: Habit): ConflictResolution {
    const conflictFields = this.findConflictingFields(localHabit, serverHabit, [
      'title', 'notes', 'frequency', 'isShared', 'type', 'healthConfig'
    ]);

    if (conflictFields.length === 0) {
      // No actual conflicts, merge timestamps
      return {
        strategy: 'merge',
        resolvedData: {
          ...serverHabit,
          updatedAt: this.getLatestTimestamp(localHabit.updatedAt, serverHabit.updatedAt),
        }
      };
    }

    // Check if one version is clearly newer
    const localTime = new Date(localHabit.updatedAt).getTime();
    const serverTime = new Date(serverHabit.updatedAt).getTime();
    const timeDifference = Math.abs(localTime - serverTime);

    // If there's more than 1 hour difference, use the newer version
    if (timeDifference > 60 * 60 * 1000) {
      if (localTime > serverTime) {
        return { strategy: 'local_wins', resolvedData: localHabit };
      } else {
        return { strategy: 'server_wins', resolvedData: serverHabit };
      }
    }

    // Try smart merge for non-critical conflicts
    if (this.canAutoMergeHabit(conflictFields)) {
      return {
        strategy: 'merge',
        resolvedData: this.mergeHabits(localHabit, serverHabit, conflictFields)
      };
    }

    // Significant conflict - needs user input
    const conflict: DataConflict = {
      id: localHabit.id,
      type: 'habit',
      localData: localHabit,
      serverData: serverHabit,
      conflictFields,
      timestamp: new Date().toISOString(),
    };

    this.addPendingConflict(conflict);

    return {
      strategy: 'user_choice',
      needsUserInput: true,
    };
  }

  private canAutoMergeHabit(conflictFields: string[]): boolean {
    // Can auto-merge if conflicts are only in non-critical fields
    const autoMergeableFields = ['notes', 'isShared'];
    return conflictFields.every(field => autoMergeableFields.includes(field));
  }

  private mergeHabits(localHabit: Habit, serverHabit: Habit, conflictFields: string[]): Habit {
    const merged = { ...serverHabit }; // Start with server version

    for (const field of conflictFields) {
      switch (field) {
        case 'notes':
          // Merge notes by concatenating if both exist
          if (localHabit.notes && serverHabit.notes) {
            merged.notes = `${serverHabit.notes}\n---\n${localHabit.notes}`;
          } else {
            merged.notes = localHabit.notes || serverHabit.notes;
          }
          break;
          
        case 'isShared':
          // Prefer sharing enabled (more permissive)
          merged.isShared = localHabit.isShared || serverHabit.isShared;
          break;
          
        default:
          // For other fields, keep server version
          break;
      }
    }

    // Always use the latest update time
    merged.updatedAt = this.getLatestTimestamp(localHabit.updatedAt, serverHabit.updatedAt);

    return merged;
  }

  // ===== PROGRESS CONFLICTS =====

  resolveProgressConflict(localProgress: HabitProgress, serverProgress: HabitProgress): ConflictResolution {
    const conflictFields = this.findConflictingFields(localProgress, serverProgress, [
      'status', 'notes'
    ]);

    if (conflictFields.length === 0) {
      return {
        strategy: 'merge',
        resolvedData: {
          ...serverProgress,
          updatedAt: this.getLatestTimestamp(localProgress.updatedAt, serverProgress.updatedAt),
        }
      };
    }

    // For progress, always prefer the latest timestamp
    const localTime = new Date(localProgress.updatedAt).getTime();
    const serverTime = new Date(serverProgress.updatedAt).getTime();

    if (localTime > serverTime) {
      return { strategy: 'local_wins', resolvedData: localProgress };
    } else if (serverTime > localTime) {
      return { strategy: 'server_wins', resolvedData: serverProgress };
    }

    // Same timestamp - try smart merge
    const mergedProgress = this.mergeProgress(localProgress, serverProgress, conflictFields);
    return {
      strategy: 'merge',
      resolvedData: mergedProgress
    };
  }

  private mergeProgress(localProgress: HabitProgress, serverProgress: HabitProgress, conflictFields: string[]): HabitProgress {
    const merged = { ...serverProgress };

    for (const field of conflictFields) {
      switch (field) {
        case 'status':
          // Prefer 'done' over 'skip' if there's a conflict
          if (localProgress.status === 'done' || serverProgress.status === 'done') {
            merged.status = 'done';
          }
          break;
          
        case 'notes':
          // Merge notes
          if (localProgress.notes && serverProgress.notes) {
            merged.notes = `${serverProgress.notes} | ${localProgress.notes}`;
          } else {
            merged.notes = localProgress.notes || serverProgress.notes;
          }
          break;
      }
    }

    merged.updatedAt = this.getLatestTimestamp(localProgress.updatedAt, serverProgress.updatedAt);
    return merged;
  }

  // ===== UTILITY METHODS =====

  private findConflictingFields(local: any, server: any, fieldsToCheck: string[]): string[] {
    const conflicts: string[] = [];

    for (const field of fieldsToCheck) {
      const localValue = local[field];
      const serverValue = server[field];

      // Handle different types of comparisons
      if (this.valuesConflict(localValue, serverValue)) {
        conflicts.push(field);
      }
    }

    return conflicts;
  }

  private valuesConflict(localValue: any, serverValue: any): boolean {
    // Handle null/undefined
    if (localValue == null && serverValue == null) return false;
    if (localValue == null || serverValue == null) return true;

    // Handle objects (like healthConfig)
    if (typeof localValue === 'object' && typeof serverValue === 'object') {
      return JSON.stringify(localValue) !== JSON.stringify(serverValue);
    }

    // Handle primitive values
    return localValue !== serverValue;
  }

  private getLatestTimestamp(timestamp1: string, timestamp2: string): string {
    return new Date(timestamp1) > new Date(timestamp2) ? timestamp1 : timestamp2;
  }

  // ===== CONFLICT QUEUE MANAGEMENT =====

  private addPendingConflict(conflict: DataConflict): void {
    this.pendingConflicts.push(conflict);
    
    // Notify listeners
    this.conflictCallbacks.forEach(callback => {
      try {
        callback(conflict);
      } catch (error) {
        console.error('Error in conflict callback:', error);
      }
    });
  }

  getPendingConflicts(): DataConflict[] {
    return [...this.pendingConflicts];
  }

  resolveConflictManually(conflictId: string, resolution: 'local' | 'server' | 'custom', customData?: any): boolean {
    const conflictIndex = this.pendingConflicts.findIndex(c => c.id === conflictId);
    if (conflictIndex === -1) return false;

    const conflict = this.pendingConflicts[conflictIndex];
    let resolvedData: any;

    switch (resolution) {
      case 'local':
        resolvedData = conflict.localData;
        break;
      case 'server':
        resolvedData = conflict.serverData;
        break;
      case 'custom':
        resolvedData = customData;
        break;
    }

    // TODO: Apply the resolution to the database
    console.log('Manually resolved conflict:', conflictId, resolution);

    // Remove from pending conflicts
    this.pendingConflicts.splice(conflictIndex, 1);
    return true;
  }

  addConflictListener(callback: (conflict: DataConflict) => void): () => void {
    this.conflictCallbacks.push(callback);
    
    return () => {
      const index = this.conflictCallbacks.indexOf(callback);
      if (index > -1) {
        this.conflictCallbacks.splice(index, 1);
      }
    };
  }

  clearResolvedConflicts(): void {
    this.pendingConflicts = [];
  }

  // ===== CONFLICT STRATEGIES =====

  getRecommendedStrategy(conflict: DataConflict): 'local' | 'server' | 'merge' {
    // Default strategies based on conflict type and fields
    if (conflict.type === 'progress') {
      // For progress, prefer the latest timestamp
      const localTime = new Date(conflict.localData.updatedAt).getTime();
      const serverTime = new Date(conflict.serverData.updatedAt).getTime();
      return localTime > serverTime ? 'local' : 'server';
    }

    if (conflict.type === 'habit') {
      // For habits, check if we can merge
      if (this.canAutoMergeHabit(conflict.conflictFields)) {
        return 'merge';
      }
      
      // Otherwise, prefer local changes (user was working offline)
      return 'local';
    }

    return 'local'; // Default fallback
  }

  // ===== BATCH CONFLICT RESOLUTION =====

  async resolveBatchConflicts(conflicts: DataConflict[], strategy: 'auto' | 'local_preference' | 'server_preference'): Promise<{
    resolved: number;
    needsManualReview: DataConflict[];
  }> {
    let resolved = 0;
    const needsManualReview: DataConflict[] = [];

    for (const conflict of conflicts) {
      let resolution: ConflictResolution;

      switch (strategy) {
        case 'auto':
          // Use recommended strategy
          const recommended = this.getRecommendedStrategy(conflict);
          if (recommended === 'merge') {
            if (conflict.type === 'habit') {
              resolution = this.resolveHabitConflict(conflict.localData, conflict.serverData);
            } else {
              resolution = this.resolveProgressConflict(conflict.localData, conflict.serverData);
            }
          } else {
            resolution = {
              strategy: recommended === 'local' ? 'local_wins' : 'server_wins',
              resolvedData: recommended === 'local' ? conflict.localData : conflict.serverData
            };
          }
          break;

        case 'local_preference':
          resolution = { strategy: 'local_wins', resolvedData: conflict.localData };
          break;

        case 'server_preference':
          resolution = { strategy: 'server_wins', resolvedData: conflict.serverData };
          break;
      }

      if (resolution.needsUserInput) {
        needsManualReview.push(conflict);
      } else {
        // TODO: Apply resolution to database
        console.log('Batch resolved conflict:', conflict.id, resolution.strategy);
        resolved++;
      }
    }

    return { resolved, needsManualReview };
  }
}

export const conflictResolver = new ConflictResolverService();