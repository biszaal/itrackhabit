import { useState, useCallback } from 'react';
import { dataService } from '../services/core';
import { HabitProgress, HabitProgressStatus } from '../types';

export const useHabitProgress = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleHabitProgress = useCallback(async (
    habitId: string, 
    date: string = new Date().toISOString().split('T')[0],
    status: 'done' | 'skipped' | 'partial' = 'done'
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      await dataService.initialize();
      
      // Check if progress already exists for this date
      const existingProgress = await dataService.getHabitProgressForDate(habitId, date);
      
      if (existingProgress) {
        // Toggle or update existing progress
        const newStatus = existingProgress.status === 'done' ? 'skipped' : 'done';
        await dataService.markHabitProgress(habitId, date, newStatus);
        return newStatus;
      } else {
        // Create new progress entry
        await dataService.markHabitProgress(habitId, date, status);
        return status;
      }
    } catch (error) {
      console.error('Failed to toggle habit progress:', error);
      setError('Failed to update progress. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProgress = useCallback(async (
    habitId: string,
    date: string,
    progressData: {
      status: 'done' | 'skipped' | 'partial';
      currentValue?: number;
      notes?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      await dataService.initialize();
      
      const existingProgress = await dataService.getHabitProgressForDate(habitId, date);
      
      // For detailed progress updates, use markHabitProgress
      await dataService.markHabitProgress(
        habitId, 
        date, 
        progressData.status,
        {
          currentValue: progressData.currentValue,
          notes: progressData.notes,
        }
      );
    } catch (error) {
      console.error('Failed to update progress:', error);
      setError('Failed to update progress. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProgressForDateRange = useCallback(async (
    habitId: string, 
    startDate: string, 
    endDate: string
  ): Promise<HabitProgress[]> => {
    try {
      setError(null);
      await dataService.initialize();
      return await dataService.getHabitProgress(habitId, startDate, endDate);
    } catch (error) {
      console.error('Failed to get progress range:', error);
      setError('Failed to load progress data.');
      return [];
    }
  }, []);

  const getTodayProgress = useCallback(async (habitId: string): Promise<HabitProgress | null> => {
    try {
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      await dataService.initialize();
      return await dataService.getHabitProgressForDate(habitId, today);
    } catch (error) {
      console.error('Failed to get today progress:', error);
      setError('Failed to load today\'s progress.');
      return null;
    }
  }, []);

  return {
    loading,
    error,
    toggleHabitProgress,
    updateProgress,
    getProgressForDateRange,
    getTodayProgress,
  };
};