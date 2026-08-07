// Unified Health Service for iOS HealthKit and Android Google Fit integration

import { Platform } from 'react-native';
import { HealthValue } from '../../types/health';

// Mock the health library for Expo Go development
let AppleHealthKit: any;
let HealthKitPermissions: any;

try {
  const healthModule = require('react-native-health');
  AppleHealthKit = healthModule.default || healthModule;
  HealthKitPermissions = healthModule.HealthKitPermissions;
} catch (error) {
  console.log('react-native-health not available, using mock implementation');
  
  // Mock implementation for development
  AppleHealthKit = {
    Constants: {
      Permissions: {
        Steps: 'Steps',
        CaloriesActive: 'ActiveEnergyBurned',
        DistanceWalkingRunning: 'DistanceWalkingRunning',
        FlightsClimbed: 'FlightsClimbed',
        Workout: 'Workouts',
        SleepAnalysis: 'SleepAnalysis',
        HeartRate: 'HeartRate',
        RestingHeartRate: 'RestingHeartRate',
      },
    },
    isAvailable: (callback: (error: string | null, available: boolean) => void) => {
      // Mock: Not available in simulator/Expo Go
      callback(null, false);
    },
    initHealthKit: () => {},
    getStepCount: () => {},
    getSamples: () => {},
    getSleepSamples: () => {},
  };
}

import { 
  HealthDataType, 
  HealthDataPoint, 
  SleepData, 
  WorkoutData, 
  DailyHealthSummary,
  HealthIntegrationStatus,
  HealthPermission,
  WorkoutType
} from '../../types/health';
import { toLocalISODate } from '../../utils/formatting/time';

class HealthService {
  private isInitialized = false;
  private permissions: any = {};

  constructor() {
    this.initializePermissions();
  }

  private initializePermissions() {
    if (Platform.OS === 'ios') {
      this.permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.CaloriesActive,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.FlightsClimbed,
            AppleHealthKit.Constants.Permissions.Workout,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.RestingHeartRate,
          ],
          write: [], // We don't need to write health data for habit tracking
        },
      };
    }
  }

  // Initialize health service and request permissions
  async initialize(): Promise<HealthIntegrationStatus> {
    if (Platform.OS === 'ios') {
      return this.initializeIOS();
    } else if (Platform.OS === 'android') {
      return this.initializeAndroid();
    } else {
      throw new Error('Health integration not supported on this platform');
    }
  }

  private async initializeIOS(): Promise<HealthIntegrationStatus> {
    return new Promise((resolve) => {
      try {
        // Check if AppleHealthKit is properly available
        if (!AppleHealthKit || typeof AppleHealthKit.isAvailable !== 'function') {
          console.log('HealthService: AppleHealthKit not available in development environment');
          resolve({
            platform: 'ios',
            isAvailable: false,
            isAuthorized: false,
            permissions: {},
          });
          return;
        }

        AppleHealthKit.isAvailable((error: string, available: boolean) => {
          if (error) {
            console.log('HealthKit availability check (expected in simulator):', error);
            resolve({
              platform: 'ios',
              isAvailable: false,
              isAuthorized: false,
              permissions: {},
            });
            return;
          }

          if (!available) {
            console.log('HealthKit not available on this device');
            resolve({
              platform: 'ios',
              isAvailable: false,
              isAuthorized: false,
              permissions: {},
            });
            return;
          }

          AppleHealthKit.initHealthKit(this.permissions, (initError: string) => {
            if (initError) {
              console.log('HealthKit initialization (expected in simulator):', initError);
              resolve({
                platform: 'ios',
                isAvailable: true,
                isAuthorized: false,
                permissions: {},
              });
              return;
            }

            this.isInitialized = true;
            resolve({
              platform: 'ios',
              isAvailable: true,
              isAuthorized: true,
              permissions: {
                [HealthDataType.STEPS]: 'authorized',
                [HealthDataType.CALORIES_BURNED]: 'authorized',
                [HealthDataType.EXERCISE_TIME]: 'authorized',
                [HealthDataType.SLEEP_ANALYSIS]: 'authorized',
              },
              lastSyncDate: new Date(),
            });
          });
        });
      } catch (error) {
        console.log('HealthService: Gracefully handling health integration error in development');
        resolve({
          platform: 'ios',
          isAvailable: false,
          isAuthorized: false,
          permissions: {},
        });
      }
    });
  }

  private async initializeAndroid(): Promise<HealthIntegrationStatus> {
    // TODO: Implement Google Fit initialization
    // This would use react-native-google-fit or similar library
    console.log('Android Google Fit integration - TODO');
    
    return {
      platform: 'android',
      isAvailable: false, // TODO: Check Google Play Services
      isAuthorized: false,
      permissions: {},
    };
  }

  // Get daily health summary for a specific date
  async getDailyHealthSummary(date: Date): Promise<DailyHealthSummary> {
    if (!this.isInitialized) {
      throw new Error('Health service not initialized');
    }

    const dateString = toLocalISODate(date);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    if (Platform.OS === 'ios') {
      return this.getDailyHealthSummaryIOS(dateString, startOfDay, endOfDay);
    } else {
      return this.getDailyHealthSummaryAndroid(dateString, startOfDay, endOfDay);
    }
  }

  private async getDailyHealthSummaryIOS(
    dateString: string, 
    startOfDay: Date, 
    endOfDay: Date
  ): Promise<DailyHealthSummary> {
    const [steps, calories, workouts, sleep] = await Promise.all([
      this.getStepsIOS(startOfDay, endOfDay),
      this.getCaloriesIOS(startOfDay, endOfDay),
      this.getWorkoutsIOS(startOfDay, endOfDay),
      this.getSleepDataIOS(startOfDay, endOfDay),
    ]);

    const exerciseMinutes = workouts.reduce((total, workout) => total + workout.duration, 0);
    const sleepDuration = sleep.reduce((total, sleepSession) => total + sleepSession.duration, 0);

    return {
      date: dateString,
      steps: steps,
      caloriesBurned: calories,
      exerciseMinutes,
      sleepDuration,
      workouts,
    };
  }

  private async getDailyHealthSummaryAndroid(
    dateString: string, 
    startOfDay: Date, 
    endOfDay: Date
  ): Promise<DailyHealthSummary> {
    // TODO: Implement Android Google Fit data retrieval
    return {
      date: dateString,
      steps: 0,
      caloriesBurned: 0,
      exerciseMinutes: 0,
      sleepDuration: 0,
      workouts: [],
    };
  }

  // iOS-specific data retrieval methods
  private async getStepsIOS(startDate: Date, endDate: Date): Promise<number> {
    return new Promise((resolve) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getStepCount(options, (error: string, results: HealthValue) => {
        if (error) {
          console.error('Steps Error:', error);
          resolve(0);
          return;
        }
        resolve(results.value || 0);
      });
    });
  }

  private async getCaloriesIOS(startDate: Date, endDate: Date): Promise<number> {
    return new Promise((resolve) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getActiveEnergyBurned(options, (error: string, results: HealthValue[]) => {
        if (error) {
          console.error('Calories Error:', error);
          resolve(0);
          return;
        }
        
        const totalCalories = results.reduce((sum, entry) => sum + (entry.value || 0), 0);
        resolve(totalCalories);
      });
    });
  }

  private async getWorkoutsIOS(startDate: Date, endDate: Date): Promise<WorkoutData[]> {
    return new Promise((resolve) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getSamples(options, (error: string, results: any[]) => {
        if (error) {
          console.error('Workouts Error:', error);
          resolve([]);
          return;
        }

        const workouts: WorkoutData[] = results.map((workout) => ({
          type: this.mapHealthKitWorkoutType(workout.activityType),
          startDate: new Date(workout.start),
          endDate: new Date(workout.end),
          duration: Math.round((new Date(workout.end).getTime() - new Date(workout.start).getTime()) / 60000),
          calories: workout.totalEnergyBurned,
          distance: workout.totalDistance,
          source: 'HealthKit',
          metadata: {
            activityType: workout.activityType,
            sourceName: workout.sourceName,
          },
        }));

        resolve(workouts);
      });
    });
  }

  private async getSleepDataIOS(startDate: Date, endDate: Date): Promise<SleepData[]> {
    return new Promise((resolve) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getSleepSamples(options, (error: string, results: any[]) => {
        if (error) {
          console.error('Sleep Error:', error);
          resolve([]);
          return;
        }

        const sleepSessions: SleepData[] = results.map((sleep) => ({
          startDate: new Date(sleep.startDate),
          endDate: new Date(sleep.endDate),
          duration: Math.round((new Date(sleep.endDate).getTime() - new Date(sleep.startDate).getTime()) / 60000),
          source: 'HealthKit',
        }));

        resolve(sleepSessions);
      });
    });
  }

  private mapHealthKitWorkoutType(activityType: number): WorkoutType {
    // Map HealthKit workout types to our WorkoutType enum
    const typeMap: { [key: number]: WorkoutType } = {
      1: WorkoutType.WALKING,
      2: WorkoutType.RUNNING,
      13: WorkoutType.CYCLING,
      46: WorkoutType.SWIMMING,
      57: WorkoutType.YOGA,
      35: WorkoutType.STRENGTH_TRAINING,
    };

    return typeMap[activityType] || WorkoutType.OTHER;
  }

  // Check if specific health data is available for a habit
  async checkHealthDataAvailability(healthDataType: HealthDataType): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    // TODO: Implement specific availability checks
    return true;
  }

  // Get health data for habit validation
  async getHealthDataForHabit(
    healthDataType: HealthDataType,
    date: Date,
    targetValue?: number
  ): Promise<{ achieved: boolean; actualValue: number; unit: string }> {
    const summary = await this.getDailyHealthSummary(date);

    switch (healthDataType) {
      case HealthDataType.STEPS:
        return {
          achieved: targetValue ? summary.steps >= targetValue : summary.steps > 0,
          actualValue: summary.steps,
          unit: 'steps',
        };

      case HealthDataType.CALORIES_BURNED:
        return {
          achieved: targetValue ? summary.caloriesBurned >= targetValue : summary.caloriesBurned > 0,
          actualValue: summary.caloriesBurned,
          unit: 'calories',
        };

      case HealthDataType.EXERCISE_TIME:
        return {
          achieved: targetValue ? summary.exerciseMinutes >= targetValue : summary.exerciseMinutes > 0,
          actualValue: summary.exerciseMinutes,
          unit: 'minutes',
        };

      case HealthDataType.SLEEP_DURATION: {
        const sleepHours = summary.sleepDuration / 60;
        return {
          achieved: targetValue ? sleepHours >= targetValue : sleepHours >= 7, // Default 7 hours
          actualValue: sleepHours,
          unit: 'hours',
        };
      }
      default:
        throw new Error(`Health data type ${healthDataType} not implemented`);
    }
  }

  // Get recent health trends for insights
  async getHealthTrends(
    healthDataType: HealthDataType,
    days: number = 7
  ): Promise<{ date: string; value: number }[]> {
    const trends = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      try {
        const healthData = await this.getHealthDataForHabit(healthDataType, date);
        trends.push({
          date: toLocalISODate(date),
          value: healthData.actualValue,
        });
      } catch (error) {
        console.error(`Error getting health data for ${date}:`, error);
        trends.push({
          date: toLocalISODate(date),
          value: 0,
        });
      }
    }

    return trends;
  }
}

export const healthService = new HealthService();