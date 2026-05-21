// Supabase Service for iTrackHabit
// Handles all database operations with Supabase cloud database

import { createClient, SupabaseClient, User as SupabaseAuthUser } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Habit, HabitProgress, FrequencyType, HabitType } from '../../types';

// Database types based on our actual Supabase schema
export interface SupabaseHabit {
  id: string;
  user_id: string;
  title: string;
  notes?: string;
  frequency: FrequencyType;
  is_shared: boolean;
  type: 'manual' | 'health' | 'location' | 'app_usage';
  health_config?: any;
  target_config?: any;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface SupabaseHabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  status: 'done' | 'missed' | 'partial' | 'skipped';
  current_value: number;
  target_value?: number;
  unit?: string;
  time_spent_seconds: number;
  notes?: string;
  mood_rating?: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  subscription_status: 'free' | 'premium' | 'trial';
  subscription_end_date?: string;
  trial_start_date?: string;
  auth_provider?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface SyncBatch {
  habits: Habit[];
  habitLogs: HabitProgress[];
  lastSyncTimestamp: string;
}

class SupabaseService {
  private supabase: SupabaseClient;
  private isInitialized = false;
  private currentUser: SupabaseUser | null = null;

  constructor() {
    // We'll get the Supabase client from AuthService later
    this.supabase = {} as SupabaseClient;
  }

  // Method to set the Supabase client from AuthService
  setSupabaseClient(supabaseClient: SupabaseClient): void {
    this.supabase = supabaseClient;
    console.log('✅ SupabaseService: Client set from AuthService');
  }

  // Method to sync user state from AuthService
  setCurrentUserFromAuth(supabaseUser: SupabaseAuthUser): void {
    this.currentUser = {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      avatar_url: supabaseUser.user_metadata?.avatar_url,
      auth_provider: supabaseUser.app_metadata?.provider || 'email',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      subscription_status: 'free',
      created_at: supabaseUser.created_at,
      updated_at: new Date().toISOString(),
    };
    console.log('✅ SupabaseService: User synced from AuthService:', this.currentUser.id);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || !this.supabase.auth) {
      return;
    }

    try {
      // Get current session
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session?.user) {
        await this.setCurrentUser(session.user);
      }

      // Listen for auth changes
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 Auth state changed:', event);
        if (session?.user) {
          await this.setCurrentUser(session.user);
        } else {
          this.currentUser = null;
        }
      });

      this.isInitialized = true;
      console.log('✅ SupabaseService initialized');
    } catch (error) {
      console.error('❌ Failed to initialize SupabaseService:', error);
    }
  }

  private async setCurrentUser(supabaseUser: SupabaseAuthUser): Promise<void> {
    try {
      // Check if user exists in our users table
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (!existingUser) {
        // Create user record if it doesn't exist
        const newUser = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0],
          avatar_url: supabaseUser.user_metadata?.avatar_url,
          auth_provider: supabaseUser.app_metadata?.provider || 'email',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        const { error } = await this.supabase
          .from('users')
          .insert([newUser]);

        if (error) {
          console.error('Failed to create user record:', error);
        } else {
          console.log('✅ Created new user record');
        }

        this.currentUser = newUser as SupabaseUser;
      } else {
        this.currentUser = existingUser;
      }
    } catch (error) {
      console.error('Failed to set current user:', error);
    }
  }

  // ===== AUTHENTICATION =====

  async signUp(email: string, password: string, name?: string): Promise<{ user: SupabaseAuthUser | null; error: string | null }> {
    if (!this.isConfigured()) {
      return { user: null, error: 'Supabase not configured - running in offline mode' };
    }

    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      return { user: data.user as any, error: null };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async signIn(email: string, password: string): Promise<{ user: SupabaseAuthUser | null; error: string | null }> {
    if (!this.isConfigured()) {
      return { user: null, error: 'Supabase not configured - running in offline mode' };
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      return { user: data.user as any, error: null };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async signOut(): Promise<{ error: string | null }> {
    if (!this.isConfigured()) {
      this.currentUser = null;
      return { error: null };
    }

    try {
      const { error } = await this.supabase.auth.signOut();
      this.currentUser = null;
      return { error: error?.message || null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  getCurrentUser(): SupabaseUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  // ===== HABIT OPERATIONS =====

  private convertHabitToSupabase(habit: Habit): Partial<SupabaseHabit> {
    return {
      id: habit.id,
      user_id: habit.userId,
      title: habit.title,
      notes: habit.notes,
      frequency: habit.frequency,
      is_shared: habit.isShared,
      type: habit.type as 'manual' | 'health' | 'location' | 'app_usage',
      health_config: habit.healthConfig,
      target_config: habit.targetConfig,
      created_at: habit.createdAt,
      deleted_at: habit.deletedAt,
      updated_at: habit.updatedAt,
    };
  }

  private convertSupabaseToHabit(supabaseHabit: SupabaseHabit): Habit {
    return {
      id: supabaseHabit.id,
      userId: supabaseHabit.user_id,
      title: supabaseHabit.title,
      notes: supabaseHabit.notes || '',
      frequency: supabaseHabit.frequency,
      type: supabaseHabit.type as HabitType,
      color: '#A8B5A0', // Default color since it's not stored in DB
      isShared: supabaseHabit.is_shared,
      pending: false,
      targetConfig: supabaseHabit.target_config || {
        hasTarget: false,
        targetValue: 1,
        unit: 'times',
        isTimeBased: false,
      },
      createdAt: supabaseHabit.created_at,
      updatedAt: supabaseHabit.updated_at,
      deletedAt: supabaseHabit.deleted_at,
    };
  }

  async syncHabit(habit: Habit): Promise<{ success: boolean; error?: string }> {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const supabaseHabit = this.convertHabitToSupabase(habit);
      
      const { error } = await this.supabase
        .from('habits')
        .upsert([supabaseHabit], { onConflict: 'id' });

      if (error) {
        console.error('Failed to sync habit:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Synced habit to Supabase:', habit.title);
      return { success: true };
    } catch (error) {
      console.error('Failed to sync habit:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getHabits(userId?: string): Promise<{ habits: Habit[]; error?: string }> {
    console.log('🔍 SupabaseService.getHabits called');
    console.log('📊 isAuthenticated:', this.isAuthenticated());
    console.log('👤 currentUser:', this.currentUser);
    
    if (!this.isAuthenticated()) {
      console.log('❌ Not authenticated, trying to get current session...');
      
      // Try to get current session from Supabase
      if (this.supabase?.auth) {
        const { data: { session } } = await this.supabase.auth.getSession();
        console.log('🔐 Current session:', session?.user?.id);
        
        if (session?.user) {
          await this.setCurrentUser(session.user);
          console.log('✅ Updated current user from session');
        } else {
          return { habits: [], error: 'Not authenticated - no valid session' };
        }
      } else {
        return { habits: [], error: 'Supabase not configured' };
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId || this.currentUser!.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        return { habits: [], error: error.message };
      }

      const habits = (data || []).map(this.convertSupabaseToHabit);
      return { habits };
    } catch (error) {
      return { habits: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deleteHabit(habitId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      // Soft delete by setting is_active to false and archived_at timestamp
      const { error } = await this.supabase
        .from('habits')
        .update({ 
          is_active: false, 
          archived_at: new Date().toISOString() 
        })
        .eq('id', habitId)
        .eq('user_id', this.currentUser!.id);

      if (error) {
        return { success: false, error: error.message };
      }

      console.log('✅ Soft deleted habit in Supabase');
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ===== HABIT PROGRESS OPERATIONS =====

  private convertProgressToSupabase(progress: HabitProgress): Partial<SupabaseHabitLog> {
    return {
      id: progress.id,
      habit_id: progress.habitId,
      user_id: this.currentUser?.id || 'unknown',
      date: progress.date,
      status: progress.status as any, // Map 'skip' to 'skipped' if needed
      current_value: progress.currentValue || 0,
      target_value: progress.targetValue,
      unit: progress.unit,
      time_spent_seconds: 0, // Map from progress if available
      notes: progress.notes,
      completed_at: progress.status === 'done' ? progress.updatedAt : undefined,
      updated_at: progress.updatedAt,
    };
  }

  private convertSupabaseToProgress(supabaseLog: SupabaseHabitLog): HabitProgress {
    return {
      id: supabaseLog.id,
      habitId: supabaseLog.habit_id,
      date: supabaseLog.date,
      status: supabaseLog.status === 'skipped' ? 'skip' : 
               supabaseLog.status === 'missed' ? 'skip' : supabaseLog.status,
      currentValue: supabaseLog.current_value,
      targetValue: supabaseLog.target_value,
      unit: supabaseLog.unit,
      notes: supabaseLog.notes || undefined,
      updatedAt: supabaseLog.updated_at,
      pending: false,
    };
  }

  async syncHabitProgress(progress: HabitProgress): Promise<{ success: boolean; error?: string }> {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const supabaseLog = this.convertProgressToSupabase(progress);
      
      const { error } = await this.supabase
        .from('habit_logs')
        .upsert([supabaseLog], { onConflict: 'habit_id,date' });

      if (error) {
        console.error('Failed to sync habit progress:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Synced habit progress to Supabase');
      return { success: true };
    } catch (error) {
      console.error('Failed to sync habit progress:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getHabitProgress(habitId: string, startDate?: string, endDate?: string): Promise<{ progress: HabitProgress[]; error?: string }> {
    if (!this.isAuthenticated()) {
      return { progress: [], error: 'Not authenticated' };
    }

    try {
      let query = this.supabase
        .from('habit_progress')
        .select('*')
        .eq('habit_id', habitId);

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query.order('date', { ascending: true });

      if (error) {
        return { progress: [], error: error.message };
      }

      const progress = (data || []).map(this.convertSupabaseToProgress);
      return { progress };
    } catch (error) {
      return { progress: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAllProgressForUser(): Promise<{ progress: HabitProgress[]; error?: string }> {
    if (!this.isAuthenticated()) {
      return { progress: [], error: 'Not authenticated' };
    }

    try {
      // Join habit_progress with habits to filter by user_id
      const { data, error } = await this.supabase
        .from('habit_progress')
        .select(`
          *,
          habits!inner(user_id)
        `)
        .eq('habits.user_id', this.currentUser!.id)
        .order('date', { ascending: true });

      if (error) {
        return { progress: [], error: error.message };
      }

      const progress = (data || []).map(this.convertSupabaseToProgress);
      console.log(`✅ Loaded ${progress.length} progress entries for user ${this.currentUser!.id}`);
      return { progress };
    } catch (error) {
      return { progress: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ===== BATCH SYNC OPERATIONS =====

  async syncBatch(batch: SyncBatch): Promise<{ success: boolean; synced: number; failed: number; errors: string[] }> {
    if (!this.isAuthenticated()) {
      return { success: false, synced: 0, failed: 0, errors: ['Not authenticated'] };
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Sync habits
    for (const habit of batch.habits) {
      const result = await this.syncHabit(habit);
      if (result.success) {
        synced++;
      } else {
        failed++;
        if (result.error) errors.push(`Habit ${habit.title}: ${result.error}`);
      }
    }

    // Sync habit progress
    for (const progress of batch.habitLogs) {
      const result = await this.syncHabitProgress(progress);
      if (result.success) {
        synced++;
      } else {
        failed++;
        if (result.error) errors.push(`Progress ${progress.id}: ${result.error}`);
      }
    }

    return {
      success: failed === 0,
      synced,
      failed,
      errors,
    };
  }

  async getChangesSince(lastSyncTimestamp: string): Promise<{ batch: SyncBatch | null; error?: string }> {
    if (!this.isAuthenticated()) {
      return { batch: null, error: 'Not authenticated' };
    }

    try {
      // Get habits updated since last sync
      const { data: habitsData, error: habitsError } = await this.supabase
        .from('habits')
        .select('*')
        .eq('user_id', this.currentUser!.id)
        .gt('updated_at', lastSyncTimestamp);

      if (habitsError) {
        return { batch: null, error: habitsError.message };
      }

      // Get habit logs updated since last sync
      const { data: logsData, error: logsError } = await this.supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', this.currentUser!.id)
        .gt('updated_at', lastSyncTimestamp);

      if (logsError) {
        return { batch: null, error: logsError.message };
      }

      const batch: SyncBatch = {
        habits: (habitsData || []).map(this.convertSupabaseToHabit),
        habitLogs: (logsData || []).map(this.convertSupabaseToProgress),
        lastSyncTimestamp: new Date().toISOString(),
      };

      return { batch };
    } catch (error) {
      return { batch: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ===== REAL-TIME SUBSCRIPTIONS =====

  subscribeToHabitChanges(callback: (payload: any) => void) {
    if (!this.isAuthenticated()) {
      console.warn('Cannot subscribe to habit changes: not authenticated');
      return () => {};
    }

    const subscription = this.supabase
      .channel('habit_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'habits',
        filter: `user_id=eq.${this.currentUser!.id}`,
      }, callback)
      .subscribe();

    return () => {
      this.supabase.removeChannel(subscription);
    };
  }

  subscribeToProgressChanges(habitId: string, callback: (payload: any) => void) {
    if (!this.isAuthenticated()) {
      console.warn('Cannot subscribe to progress changes: not authenticated');
      return () => {};
    }

    const subscription = this.supabase
      .channel(`habit_progress_${habitId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'habit_logs',
        filter: `habit_id=eq.${habitId}`,
      }, callback)
      .subscribe();

    return () => {
      this.supabase.removeChannel(subscription);
    };
  }

  // ===== UTILITY METHODS =====

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);

      return { success: !error, error: error?.message };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  isConfigured(): boolean {
    // Hard off-switch for local-only mode (Supabase paused / no backend).
    // Imported lazily to avoid a circular dep on the config module.
    try {
      const { LOCAL_ONLY } = require('../../config/runtime');
      if (LOCAL_ONLY) return false;
    } catch {}
    try {
      return !!this.supabase &&
             typeof this.supabase.auth !== 'undefined' &&
             typeof this.supabase.from === 'function'; // Check if it's a real Supabase client
    } catch {
      return false;
    }
  }

  // Debug method to check if we can access data
  async debugGetAllHabits(): Promise<{ data: any[]; error?: string; count: number }> {
    console.log('🔍 Debug: Attempting to fetch ALL habits (no auth check)...');
    
    try {
      const { data, error, count } = await this.supabase
        .from('habits')
        .select('*', { count: 'exact' });

      console.log('📊 Raw query result:', { data: data?.length, error, count });
      
      if (error) {
        return { data: [], error: error.message, count: 0 };
      }

      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('❌ Debug query failed:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error', count: 0 };
    }
  }
}

export const supabaseService = new SupabaseService();