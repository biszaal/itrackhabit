// Backend API Configuration
// Note: Supabase credentials are now only stored in backend/.env
// All database operations go through backend API endpoints

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Placeholder client - will be replaced with backend API calls
const supabaseUrl = 'placeholder';
const supabaseAnonKey = 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic token refresh
    autoRefreshToken: true,
    // Persist authentication state across app restarts
    persistSession: true,
    // Use AsyncStorage for React Native
    storage: require('@react-native-async-storage/async-storage').default,
  },
  realtime: {
    // Enable real-time subscriptions for collaborative features
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database table names for type safety
export const TABLES = {
  USERS: 'users',
  HABITS: 'habits', 
  HABIT_PROGRESS: 'habit_progress',
  CHALLENGES: 'challenges',
  CHALLENGE_PARTICIPANTS: 'challenge_participants',
  FRIENDS: 'friends',
  FRIEND_REQUESTS: 'friend_requests',
} as const;

// Database types for Supabase
export interface SupabaseUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  subscription_status: 'free' | 'premium' | 'trial';
  subscription_end_date?: string;
  trial_start_date?: string;
  auth_provider?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseHabit {
  id: string;
  user_id: string;
  title: string;
  notes?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  is_shared: boolean;
  type: 'manual' | 'health';
  health_config?: any; // JSON object
  target_config?: any; // JSON object
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface SupabaseHabitProgress {
  id: string;
  habit_id: string;
  date: string;
  status: 'done' | 'skip' | 'partial';
  current_value?: number;
  target_value?: number;
  unit?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseChallenge {
  id: string;
  title: string;
  description: string;
  type: 'streak' | 'completion' | 'custom';
  start_date: string;
  end_date: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseFriend {
  id: string;
  user_id: string;
  friend_user_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  updated_at: string;
}

export interface SupabaseFriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}