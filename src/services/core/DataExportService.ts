import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { dataService } from './DataService';
import { achievementService } from '../premium/AchievementService';
import { Habit, HabitProgress } from '../../types';

export interface ExportedData {
  version: string;
  exportDate: string;
  metadata: {
    appVersion: string;
    totalHabits: number;
    totalProgress: number;
    totalAchievements: number;
    dateRange: {
      earliest: string;
      latest: string;
    };
  };
  habits: Habit[];
  progress: HabitProgress[];
  achievements: any[];
  preferences: {
    notifications: any;
    themes: any;
    [key: string]: any;
  };
}

export interface ImportResult {
  success: boolean;
  message: string;
  imported: {
    habits: number;
    progress: number;
    achievements: number;
  };
  errors: string[];
}

class DataExportService {
  private readonly EXPORT_VERSION = '1.0';
  private readonly APP_VERSION = '1.0.0';

  /**
   * Export all user data to a JSON file
   */
  async exportAllData(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      console.log('🚀 Starting data export...');
      
      // Initialize services
      await dataService.initialize();
      await achievementService.initialize();
      
      // Collect all data
      const habits = await dataService.getHabits();
      const achievements = achievementService.getUserAchievements();
      
      // Get all progress for all habits
      const allProgress: HabitProgress[] = [];
      for (const habit of habits) {
        const habitProgress = await dataService.getHabitProgress(habit.id);
        allProgress.push(...habitProgress);
      }
      
      // Get date range
      const progressDates = allProgress.map(p => new Date(p.date));
      const earliestDate = progressDates.length > 0 ? new Date(Math.min(...progressDates.map(d => d.getTime()))) : new Date();
      const latestDate = progressDates.length > 0 ? new Date(Math.max(...progressDates.map(d => d.getTime()))) : new Date();
      
      // Create export data structure
      const exportData: ExportedData = {
        version: this.EXPORT_VERSION,
        exportDate: new Date().toISOString(),
        metadata: {
          appVersion: this.APP_VERSION,
          totalHabits: habits.length,
          totalProgress: allProgress.length,
          totalAchievements: achievements.length,
          dateRange: {
            earliest: earliestDate.toISOString(),
            latest: latestDate.toISOString(),
          },
        },
        habits: habits,
        progress: allProgress,
        achievements: achievements,
        preferences: {
          notifications: {}, // Could be expanded to include actual preferences
          themes: {},
        },
      };
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `iTrackHabit_backup_${timestamp}.json`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;
      
      // Write to file
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));
      
      console.log(`✅ Data exported successfully to: ${filePath}`);
      return { success: true, filePath };
      
    } catch (error) {
      console.error('❌ Export failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Export data as CSV format for spreadsheet analysis
   */
  async exportAsCSV(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      console.log('📊 Starting CSV export...');
      
      await dataService.initialize();
      const habits = await dataService.getHabitsWithStats();
      
      // Create CSV headers
      const headers = [
        'Habit Name',
        'Category',
        'Created Date',
        'Current Streak',
        'Longest Streak',
        'Completion Rate (%)',
        'Total Completions',
        'Target Value',
        'Target Unit',
        'Frequency',
        'Status'
      ];
      
      // Create CSV rows
      const rows = habits.map(habit => [
        `"${habit.title}"`,
        habit.category || 'Uncategorized',
        habit.createdAt.split('T')[0],
        habit.currentStreak.toString(),
        habit.longestStreak.toString(),
        Math.round(habit.completionRate).toString(),
        habit.totalCompletions.toString(),
        habit.targetConfig?.targetValue?.toString() || '',
        habit.targetConfig?.unit || '',
        habit.frequency,
        habit.deletedAt ? 'Deleted' : 'Active'
      ]);
      
      // Combine headers and rows
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      
      // Create filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `iTrackHabit_habits_${timestamp}.csv`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;
      
      // Write CSV file
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      
      console.log(`✅ CSV exported successfully to: ${filePath}`);
      return { success: true, filePath };
      
    } catch (error) {
      console.error('❌ CSV export failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Export detailed progress data as CSV
   */
  async exportProgressAsCSV(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      console.log('📈 Starting progress CSV export...');
      
      await dataService.initialize();
      const habits = await dataService.getHabits();
      
      // Get all progress data
      const allProgress: (HabitProgress & { habitTitle: string })[] = [];
      for (const habit of habits) {
        const habitProgress = await dataService.getHabitProgress(habit.id);
        habitProgress.forEach(progress => {
          allProgress.push({
            ...progress,
            habitTitle: habit.title,
          });
        });
      }
      
      // Sort by date
      allProgress.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Create CSV headers
      const headers = [
        'Date',
        'Habit Name',
        'Status',
        'Current Value',
        'Target Value',
        'Unit',
        'Notes',
        'Updated At'
      ];
      
      // Create CSV rows
      const rows = allProgress.map(progress => [
        progress.date,
        `"${progress.habitTitle}"`,
        progress.status,
        progress.currentValue?.toString() || '',
        progress.targetValue?.toString() || '',
        progress.unit || '',
        `"${progress.notes || ''}"`,
        progress.updatedAt.split('T')[0]
      ]);
      
      // Combine headers and rows
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      
      // Create filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `iTrackHabit_progress_${timestamp}.csv`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;
      
      // Write CSV file
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      
      console.log(`✅ Progress CSV exported successfully to: ${filePath}`);
      return { success: true, filePath };
      
    } catch (error) {
      console.error('❌ Progress CSV export failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Share exported file
   */
  async shareFile(filePath: string): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Not Available', 'Sharing is not available on this device');
        return;
      }
      
      await Sharing.shareAsync(filePath, {
        mimeType: filePath.endsWith('.csv') ? 'text/csv' : 'application/json',
        dialogTitle: 'Share iTrackHabit Data',
      });
      
    } catch (error) {
      console.error('❌ Sharing failed:', error);
      Alert.alert('Sharing Failed', 'Failed to share the file');
    }
  }

  /**
   * Import data from a JSON file
   */
  async importFromFile(): Promise<ImportResult> {
    try {
      console.log('📥 Starting data import...');
      
      // Pick a file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        return {
          success: false,
          message: 'Import cancelled',
          imported: { habits: 0, progress: 0, achievements: 0 },
          errors: [],
        };
      }

      // Read the file
      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const importData: ExportedData = JSON.parse(fileContent);
      
      // Validate import data
      const validation = this.validateImportData(importData);
      if (!validation.valid) {
        return {
          success: false,
          message: 'Invalid import file',
          imported: { habits: 0, progress: 0, achievements: 0 },
          errors: validation.errors,
        };
      }
      
      // Perform import
      return await this.performImport(importData);
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      return {
        success: false,
        message: 'Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        imported: { habits: 0, progress: 0, achievements: 0 },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Validate imported data structure
   */
  private validateImportData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields
    if (!data.version) errors.push('Missing version');
    if (!data.habits || !Array.isArray(data.habits)) errors.push('Invalid habits data');
    if (!data.progress || !Array.isArray(data.progress)) errors.push('Invalid progress data');
    if (!data.metadata) errors.push('Missing metadata');
    
    // Check version compatibility
    if (data.version !== this.EXPORT_VERSION) {
      errors.push(`Version mismatch: expected ${this.EXPORT_VERSION}, got ${data.version}`);
    }
    
    // Validate habits structure
    if (data.habits && Array.isArray(data.habits)) {
      data.habits.forEach((habit: any, index: number) => {
        if (!habit.id) errors.push(`Habit ${index}: missing ID`);
        if (!habit.title) errors.push(`Habit ${index}: missing title`);
        if (!habit.createdAt) errors.push(`Habit ${index}: missing creation date`);
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Perform the actual import operation
   */
  private async performImport(importData: ExportedData): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      message: 'Import completed successfully',
      imported: { habits: 0, progress: 0, achievements: 0 },
      errors: [],
    };
    
    try {
      await dataService.initialize();
      
      // Import habits
      for (const habit of importData.habits) {
        try {
          // Check if habit already exists
          const habits = await dataService.getHabits();
          const existingHabit = habits.find(h => h.id === habit.id);
          if (!existingHabit) {
            await dataService.createHabit({
              title: habit.title,
              notes: habit.notes,
              frequency: habit.frequency,
              type: habit.type,
              targetConfig: habit.targetConfig,
              emoji: habit.emoji,
              color: habit.color,
            });
            result.imported.habits++;
          }
        } catch (error) {
          result.errors.push(`Failed to import habit "${habit.title}": ${error}`);
        }
      }
      
      // Import progress data
      for (const progress of importData.progress) {
        try {
          // Check if progress entry already exists
          const existingProgress = await dataService.getHabitProgressForDate(progress.habitId, progress.date);
          if (!existingProgress) {
            await dataService.markHabitProgress(
              progress.habitId,
              progress.date,
              progress.status as 'done' | 'skipped' | 'partial',
              {
                currentValue: progress.currentValue,
                targetValue: progress.targetValue,
                unit: progress.unit,
                notes: progress.notes,
              }
            );
            result.imported.progress++;
          }
        } catch (error) {
          result.errors.push(`Failed to import progress for ${progress.date}: ${error}`);
        }
      }
      
      // Import achievements (if available)
      if (importData.achievements && importData.achievements.length > 0) {
        result.imported.achievements = importData.achievements.length;
        // Note: Achievement import would need to be implemented in AchievementService
      }
      
      // Set success message
      result.message = `Successfully imported ${result.imported.habits} habits and ${result.imported.progress} progress entries`;
      
      if (result.errors.length > 0) {
        result.message += `. ${result.errors.length} errors occurred.`;
      }
      
    } catch (error) {
      result.success = false;
      result.message = 'Import failed: ' + (error instanceof Error ? error.message : 'Unknown error');
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }
    
    return result;
  }

  /**
   * Get export file info
   */
  async getExportFileInfo(): Promise<{
    totalSize: number;
    habitCount: number;
    progressCount: number;
    dateRange: { earliest: string; latest: string };
  }> {
    try {
      await dataService.initialize();
      const habits = await dataService.getHabits();
      
      let totalProgress = 0;
      const allDates: Date[] = [];
      
      for (const habit of habits) {
        const progress = await dataService.getHabitProgress(habit.id);
        totalProgress += progress.length;
        progress.forEach(p => allDates.push(new Date(p.date)));
      }
      
      const earliestDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();
      const latestDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date();
      
      // Estimate file size (rough calculation)
      const estimatedSize = (habits.length * 500) + (totalProgress * 200); // bytes per item
      
      return {
        totalSize: estimatedSize,
        habitCount: habits.length,
        progressCount: totalProgress,
        dateRange: {
          earliest: earliestDate.toLocaleDateString(),
          latest: latestDate.toLocaleDateString(),
        },
      };
    } catch (error) {
      console.error('Failed to get export info:', error);
      return {
        totalSize: 0,
        habitCount: 0,
        progressCount: 0,
        dateRange: { earliest: 'N/A', latest: 'N/A' },
      };
    }
  }

  /**
   * Clean up temporary export files
   */
  async cleanupExportFiles(): Promise<void> {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory!);
      const exportFiles = files.filter(file => file.startsWith('iTrackHabit_backup_') || file.startsWith('iTrackHabit_habits_') || file.startsWith('iTrackHabit_progress_'));
      
      for (const file of exportFiles) {
        const filePath = `${FileSystem.documentDirectory}${file}`;
        const info = await FileSystem.getInfoAsync(filePath);
        
        // Delete files older than 7 days
        if (info.exists && info.modificationTime) {
          const fileAge = Date.now() - info.modificationTime;
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          
          if (fileAge > sevenDays) {
            await FileSystem.deleteAsync(filePath);
            console.log(`🗑️ Cleaned up old export file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup export files:', error);
    }
  }
}

export const dataExportService = new DataExportService();