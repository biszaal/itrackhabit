export type FrequencyType = 'daily' | 'weekly' | 'custom';
export type HabitProgressStatus = 'done' | 'skip' | 'partial';
export type FriendStatus = 'pending' | 'accepted';
export type ChallengeType = 'streak' | 'completion' | 'custom';
export type HabitType = 'manual' | 'health';
export type HealthMetricType = 'steps' | 'exercise_minutes' | 'calories_burned' | 'sleep_hours' | 'workout_count';
export type UserSubscriptionStatus = 'free' | 'premium' | 'trial';
export type AuthProvider = 'email' | 'google' | 'apple';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  subscriptionStatus: UserSubscriptionStatus;
  subscriptionEndDate?: string;
  trialStartDate?: string;
  authProvider?: AuthProvider;
  createdAt: string;
  updatedAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  name: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  maxHabits: number | null; // null means unlimited
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  notes?: string;
  frequency: FrequencyType;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  serverId?: string;
  pending: boolean;
  
  // Habit target configuration
  type: HabitType;
  healthConfig?: HealthHabitConfig;
  targetConfig?: HabitTargetConfig; // For manual habits with measurable targets
}

export interface HabitTargetConfig {
  hasTarget: boolean;
  targetValue?: number;
  unit?: string; // 'minutes', 'pages', 'glasses', 'reps', etc.
  isTimeBased?: boolean; // For time tracking
}

export interface HealthHabitConfig {
  metricType: HealthMetricType;
  targetValue: number;
  unit: string;
  autoTrack: boolean;
  validationRules?: {
    minValue?: number;
    maxValue?: number;
    requiresManualConfirmation?: boolean;
  };
}

export interface HabitProgress {
  id: string;
  habitId: string;
  date: string;
  status: HabitProgressStatus;
  currentValue?: number; // For partial completion tracking (e.g., 15 minutes out of 30)
  targetValue?: number; // Target value from habit config
  unit?: string; // Unit from habit config (minutes, pages, etc.)
  notes?: string;
  updatedAt: string;
  pending: boolean;
  serverId?: string;
}

export interface Friend {
  id: string;
  userId: string;
  friendUserId: string;
  status: FriendStatus;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface FriendWithDetails {
  id: string;
  userId: string;
  friendUserId: string;
  status: FriendStatus;
  createdAt: string;
  friendName: string;
  friendEmail: string;
  friendAvatarUrl?: string;
  sharedHabits?: Array<{
    id: string;
    title: string;
    currentStreak: number;
    completionRate: number;
    isDoneToday: boolean;
    type: string;
  }>;
}

export interface Challenge {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  type: ChallengeType;
  habitId?: string;
  startDate: string;
  endDate: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  isDoneToday: boolean;
  totalCompletions: number;
}

export interface ChallengeWithStats extends Challenge {
  leaderboard: Array<{
    userId: string;
    userName: string;
    score: number;
    rank: number;
  }>;
  userRank?: number;
  userScore?: number;
}

export interface DailyStats {
  date: string;
  totalHabits: number;
  completedHabits: number;
  completionRate: number;
}

export interface UserProfile extends User {
  totalHabits: number;
  totalCompletions: number;
  currentStreaks: number;
  averageCompletionRate: number;
}