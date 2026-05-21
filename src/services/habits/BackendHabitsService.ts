import { apiClient } from '../../config/api';
import { Habit, HabitProgress } from '../../types';

class BackendHabitsService {
  
  // Get user's habits
  async getUserHabits(): Promise<Habit[]> {
    try {
      console.log('📋 Fetching habits from backend...');
      const response = await apiClient.get<Habit[]>('/api/habits');
      console.log(`✅ Fetched ${response.length} habits from backend`);
      return response;
    } catch (error: unknown) {
      console.error('❌ Failed to fetch habits:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch habits';
      throw new Error(message);
    }
  }

  // Create a new habit
  async createHabit(habitData: {
    title: string;
    description?: string;
    frequency: 'daily' | 'weekly' | 'custom';
    targetValue?: number;
    unit?: string;
    isTimeBased?: boolean;
  }): Promise<Habit> {
    try {
      console.log('➕ Creating habit via backend...', habitData.title);
      const response = await apiClient.post<Habit>('/api/habits', habitData);
      console.log('✅ Habit created successfully:', response.id);
      return response;
    } catch (error: unknown) {
      console.error('❌ Failed to create habit:', error);
      const message = error instanceof Error ? error.message : 'Failed to create habit';
      throw new Error(message);
    }
  }

  // Update an existing habit
  async updateHabit(habitId: string, updates: {
    title?: string;
    description?: string;
    frequency?: 'daily' | 'weekly' | 'custom';
    targetValue?: number;
    unit?: string;
    isTimeBased?: boolean;
  }): Promise<Habit> {
    try {
      console.log('🔄 Updating habit via backend...', habitId);
      const response = await apiClient.put<Habit>(`/api/habits/${habitId}`, updates);
      console.log('✅ Habit updated successfully:', response.id);
      return response;
    } catch (error: unknown) {
      console.error('❌ Failed to update habit:', error);
      const message = error instanceof Error ? error.message : 'Failed to update habit';
      throw new Error(message);
    }
  }

  // Delete a habit (soft delete)
  async deleteHabit(habitId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting habit via backend...', habitId);
      await apiClient.delete(`/api/habits/${habitId}`);
      console.log('✅ Habit deleted successfully:', habitId);
    } catch (error: unknown) {
      console.error('❌ Failed to delete habit:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete habit';
      throw new Error(message);
    }
  }

  // Get habit progress for a date range
  async getHabitProgress(habitId: string, startDate?: string, endDate?: string): Promise<HabitProgress[]> {
    try {
      console.log('📊 Fetching habit progress from backend...', habitId);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `/api/habits/${habitId}/progress${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiClient.get<HabitProgress[]>(url);
      console.log(`✅ Fetched ${response.length} progress entries for habit ${habitId}`);
      return response;
    } catch (error: unknown) {
      console.error('❌ Failed to fetch habit progress:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch habit progress';
      throw new Error(message);
    }
  }

  // Record habit progress
  async recordProgress(habitId: string, progressData: {
    date: string;
    status: 'done' | 'skip' | 'partial';
    currentValue?: number;
    notes?: string;
  }): Promise<HabitProgress> {
    try {
      console.log('✅ Recording progress via backend...', habitId, progressData.status);
      const response = await apiClient.post<HabitProgress>(`/api/habits/${habitId}/progress`, progressData);
      console.log('✅ Progress recorded successfully for habit:', habitId);
      return response;
    } catch (error: unknown) {
      console.error('❌ Failed to record progress:', error);
      const message = error instanceof Error ? error.message : 'Failed to record progress';
      throw new Error(message);
    }
  }

  // Create default habits for new users
  async createDefaultHabits(): Promise<Habit[]> {
    try {
      console.log('🎯 Creating default habits via backend...');
      const response = await apiClient.post<Habit[]>('/api/habits/create-defaults', {});
      console.log(`✅ Created ${response.length} default habits`);
      return response;
    } catch (error: unknown) {
      console.error('❌ Failed to create default habits:', error);
      const message = error instanceof Error ? error.message : 'Failed to create default habits';
      throw new Error(message);
    }
  }
}

export const backendHabitsService = new BackendHabitsService();