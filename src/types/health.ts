// Health integration types for iOS HealthKit and Android Google Fit

export interface HealthPermission {
  type: HealthDataType;
  access: 'read' | 'write' | 'readwrite';
}

export enum HealthDataType {
  // Exercise/Activity
  STEPS = 'steps',
  CALORIES_BURNED = 'caloriesBurned',
  ACTIVE_ENERGY = 'activeEnergyBurned',
  EXERCISE_TIME = 'exerciseTime',
  WORKOUT = 'workout',
  DISTANCE_WALKING = 'distanceWalkingRunning',
  FLIGHTS_CLIMBED = 'flightsClimbed',
  
  // Sleep
  SLEEP_ANALYSIS = 'sleepAnalysis',
  TIME_IN_BED = 'timeInBed',
  SLEEP_DURATION = 'sleepDuration',
  
  // Heart Rate
  HEART_RATE = 'heartRate',
  RESTING_HEART_RATE = 'restingHeartRate',
  
  // Other Health Metrics
  WEIGHT = 'bodyMass',
  HEIGHT = 'height',
  BODY_FAT = 'bodyFatPercentage',
}

export enum WorkoutType {
  WALKING = 'walking',
  RUNNING = 'running',
  CYCLING = 'cycling',
  SWIMMING = 'swimming',
  YOGA = 'yoga',
  STRENGTH_TRAINING = 'strengthTraining',
  HIIT = 'hiit',
  OTHER = 'other',
}

export interface HealthDataPoint {
  type: HealthDataType;
  value: number;
  unit: string;
  date: Date;
  source: string;
  metadata?: Record<string, any>;
}

export interface SleepData {
  startDate: Date;
  endDate: Date;
  duration: number; // in minutes
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
  stages?: SleepStage[];
  source: string;
}

export interface SleepStage {
  stage: 'awake' | 'light' | 'deep' | 'rem';
  startDate: Date;
  endDate: Date;
  duration: number; // in minutes
}

export interface WorkoutData {
  type: WorkoutType;
  startDate: Date;
  endDate: Date;
  duration: number; // in minutes
  calories?: number;
  distance?: number; // in meters
  heartRate?: {
    average?: number;
    max?: number;
    min?: number;
  };
  source: string;
  metadata?: Record<string, any>;
}

export interface DailyHealthSummary {
  date: string; // YYYY-MM-DD
  steps: number;
  caloriesBurned: number;
  exerciseMinutes: number;
  sleepDuration: number; // in minutes
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  workouts: WorkoutData[];
  heartRateAverage?: number;
}

export interface HealthGoal {
  type: HealthDataType;
  target: number;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly';
}

export interface HealthHabitConfig {
  healthDataType: HealthDataType;
  goal: HealthGoal;
  autoTrack: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily';
  validationRules?: {
    minValue?: number;
    maxValue?: number;
    requiresManualConfirmation?: boolean;
  };
}

export interface HealthIntegrationStatus {
  platform: 'ios' | 'android';
  isAvailable: boolean;
  isAuthorized: boolean;
  permissions: {
    [key in HealthDataType]?: 'authorized' | 'denied' | 'notDetermined';
  };
  lastSyncDate?: Date;
}

// Platform-specific types
export interface iOSHealthKitData {
  quantity?: number;
  quantityType: string;
  startDate: string;
  endDate: string;
  device?: string;
  sourceBundle?: string;
  sourceName?: string;
  uuid?: string;
}

export interface AndroidGoogleFitData {
  dataSet: {
    dataSourceId: string;
    maxEndTimeNs: string;
    minStartTimeNs: string;
    point: Array<{
      dataTypeName: string;
      endTimeNanos: string;
      startTimeNanos: string;
      value: Array<{
        fpVal?: number;
        intVal?: number;
        stringVal?: string;
      }>;
    }>;
  };
}

export interface HealthTrend {
  date: string;
  value: number;
  change?: number;
  changePercentage?: number;
}

export interface HealthValue {
  value: number;
  unit: string;
  date: string;
}