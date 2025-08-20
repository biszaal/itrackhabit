// Automatic Progress Tracker for Health-Based Habits

import AsyncStorage from '@react-native-async-storage/async-storage';
import { healthService } from './HealthService';
import { Habit, HabitProgress, HealthMetricType } from '../types';
import { HealthDataType } from '../types/health';

interface AutoTrackingConfig {
  habitId: string;
  metricType: HealthMetricType;
  targetValue: number;
  unit: string;
  lastChecked: string; // ISO date string
}

class AutoProgressTracker {
  private autoTrackingConfigs: Map<string, AutoTrackingConfig> = new Map();
  private readonly STORAGE_KEY = '@itrackhabit_auto_tracking_configs';

  constructor() {
    this.loadConfigs();
  }

  // Load auto-tracking configurations from storage
  private async loadConfigs() {
    try {
      const configsJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (configsJson) {
        const configs: AutoTrackingConfig[] = JSON.parse(configsJson);
        configs.forEach(config => {
          this.autoTrackingConfigs.set(config.habitId, config);
        });
      }
    } catch (error) {
      console.error('Failed to load auto-tracking configs:', error);
    }
  }

  // Save auto-tracking configurations to storage
  private async saveConfigs() {
    try {
      const configs = Array.from(this.autoTrackingConfigs.values());
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error('Failed to save auto-tracking configs:', error);
    }
  }

  // Register a habit for automatic tracking
  async registerHabitForAutoTracking(habit: Habit): Promise<void> {
    if (habit.type !== 'health' || !habit.healthConfig?.autoTrack) {
      return;
    }

    const config: AutoTrackingConfig = {
      habitId: habit.id,
      metricType: habit.healthConfig.metricType,
      targetValue: habit.healthConfig.targetValue,
      unit: habit.healthConfig.unit,
      lastChecked: new Date().toISOString(),
    };

    this.autoTrackingConfigs.set(habit.id, config);
    await this.saveConfigs();
  }

  // Unregister a habit from automatic tracking
  async unregisterHabitFromAutoTracking(habitId: string): Promise<void> {
    this.autoTrackingConfigs.delete(habitId);
    await this.saveConfigs();
  }

  // Check and update progress for all auto-tracked habits
  async checkAndUpdateProgress(): Promise<HabitProgress[]> {
    const updatedProgress: HabitProgress[] = [];
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    for (const config of this.autoTrackingConfigs.values()) {
      try {
        const progress = await this.checkHabitProgress(config, todayString);
        if (progress) {
          updatedProgress.push(progress);
          
          // Update last checked date
          config.lastChecked = today.toISOString();
          this.autoTrackingConfigs.set(config.habitId, config);
        }
      } catch (error) {
        console.error(`Failed to check progress for habit ${config.habitId}:`, error);
      }
    }

    if (updatedProgress.length > 0) {
      await this.saveConfigs();
    }

    return updatedProgress;
  }

  // Check progress for a specific habit
  private async checkHabitProgress(
    config: AutoTrackingConfig, 
    date: string
  ): Promise<HabitProgress | null> {
    const healthDataType = this.mapMetricTypeToHealthDataType(config.metricType);
    
    try {
      const healthData = await healthService.getHealthDataForHabit(
        healthDataType,
        new Date(date),
        config.targetValue
      );

      // Only create progress if goal is achieved
      if (healthData.achieved) {
        return {
          id: `auto_${config.habitId}_${date}`,
          habitId: config.habitId,
          date,
          status: 'done',
          notes: `Auto-tracked: ${healthData.actualValue} ${config.unit}`,
          updatedAt: new Date().toISOString(),
          pending: true, // Will be synced to server
        };
      }
    } catch (error) {
      console.error(`Health data check failed for ${config.metricType}:`, error);
    }

    return null;
  }

  // Check progress for a specific date range (for manual sync)
  async checkProgressForDateRange(
    habitId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HabitProgress[]> {
    const config = this.autoTrackingConfigs.get(habitId);
    if (!config) {
      throw new Error(`Habit ${habitId} not registered for auto-tracking`);
    }

    const progress: HabitProgress[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dailyProgress = await this.checkHabitProgress(config, dateString);
      
      if (dailyProgress) {
        progress.push(dailyProgress);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return progress;
  }

  // Get health insights for a habit
  async getHealthInsights(habitId: string, days: number = 7): Promise<{
    average: number;
    trend: 'improving' | 'declining' | 'stable';
    bestDay: { date: string; value: number };
    worstDay: { date: string; value: number };
  } | null> {
    const config = this.autoTrackingConfigs.get(habitId);
    if (!config) {
      return null;
    }

    const healthDataType = this.mapMetricTypeToHealthDataType(config.metricType);
    
    try {
      const trends = await healthService.getHealthTrends(healthDataType, days);
      
      if (trends.length === 0) {
        return null;
      }

      const values = trends.map(t => t.value);
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;

      // Calculate trend (simple linear regression slope)
      const n = trends.length;
      const sumX = trends.reduce((sum, _, i) => sum + i, 0);
      const sumY = values.reduce((sum, val) => sum + val, 0);
      const sumXY = trends.reduce((sum, trend, i) => sum + (i * trend.value), 0);
      const sumXX = trends.reduce((sum, _, i) => sum + (i * i), 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const trend = slope > 0.1 ? 'improving' : slope < -0.1 ? 'declining' : 'stable';

      const bestDay = trends.reduce((best, current) => 
        current.value > best.value ? current : best
      );
      
      const worstDay = trends.reduce((worst, current) => 
        current.value < worst.value ? current : worst
      );

      return {
        average: Math.round(average * 100) / 100,
        trend,
        bestDay: { date: bestDay.date, value: bestDay.value },
        worstDay: { date: worstDay.date, value: worstDay.value },
      };
    } catch (error) {
      console.error('Failed to get health insights:', error);
      return null;
    }
  }

  // Map our metric types to health service data types
  private mapMetricTypeToHealthDataType(metricType: HealthMetricType): HealthDataType {
    const mapping: Record<HealthMetricType, HealthDataType> = {
      steps: HealthDataType.STEPS,
      exercise_minutes: HealthDataType.EXERCISE_TIME,
      calories_burned: HealthDataType.CALORIES_BURNED,
      sleep_hours: HealthDataType.SLEEP_DURATION,
      workout_count: HealthDataType.WORKOUT,
    };

    return mapping[metricType];
  }

  // Get all registered habit IDs
  getRegisteredHabitIds(): string[] {
    return Array.from(this.autoTrackingConfigs.keys());
  }

  // Get configuration for a specific habit
  getHabitConfig(habitId: string): AutoTrackingConfig | undefined {
    return this.autoTrackingConfigs.get(habitId);
  }

  // Update target value for a habit
  async updateHabitTarget(habitId: string, newTargetValue: number): Promise<void> {
    const config = this.autoTrackingConfigs.get(habitId);
    if (config) {
      config.targetValue = newTargetValue;
      this.autoTrackingConfigs.set(habitId, config);
      await this.saveConfigs();
    }
  }

  // Check if health data is sufficient for auto-tracking
  async validateHealthDataAvailability(metricType: HealthMetricType): Promise<{
    available: boolean;
    message: string;
  }> {
    const healthDataType = this.mapMetricTypeToHealthDataType(metricType);
    
    try {
      const isAvailable = await healthService.checkHealthDataAvailability(healthDataType);
      
      if (!isAvailable) {
        return {
          available: false,
          message: `${metricType} data is not available. Please check your health app permissions.`,
        };
      }

      // Test if we can get recent data
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const testData = await healthService.getHealthDataForHabit(healthDataType, yesterday);
      
      return {
        available: true,
        message: `Found ${testData.actualValue} ${testData.unit} for yesterday`,
      };
    } catch (error) {
      return {
        available: false,
        message: `Unable to access ${metricType} data: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

export const autoProgressTracker = new AutoProgressTracker();