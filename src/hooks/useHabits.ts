import { useState, useEffect, useCallback } from 'react';
import { dataService } from '../services/core';
import { authService } from '../services/auth';
import { Habit, HabitWithStats } from '../types';

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitsWithStats, setHabitsWithStats] = useState<HabitWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadHabits = useCallback(async () => {
    try {
      console.log('🔄 useHabits: loadHabits called');
      setError(null);
      await dataService.initialize();
      
      console.log('📊 Calling dataService.getHabits()...');
      const [allHabits, statsHabits] = await Promise.all([
        dataService.getHabits(),
        dataService.getHabitsWithStats()
      ]);
      
      console.log('✅ Received habits from dataService:', allHabits.length);
      console.log('✅ Received statsHabits from dataService:', statsHabits.length);
      
      const filteredHabits = allHabits.filter(h => !h.deletedAt);
      const filteredStatsHabits = statsHabits.filter(h => !h.deletedAt);
      
      console.log('📋 Setting habits state:', filteredHabits.length);
      setHabits(filteredHabits);
      setHabitsWithStats(filteredStatsHabits);
      
    } catch (error) {
      console.error('❌ Failed to load habits:', error);
      setError('Failed to load habits. Please try again.');
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  }, [loadHabits]);

  const addHabit = useCallback(async (habitData: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const result = await dataService.createHabit(habitData);
      if (result.habit) {
        setHabits(prev => [...prev, result.habit!]);
        return result.habit;
      } else {
        throw new Error(result.reason || 'Failed to create habit');
      }
    } catch (error) {
      console.error('Failed to add habit:', error);
      throw new Error('Failed to add habit. Please try again.');
    }
  }, []);

  const updateHabit = useCallback(async (habitId: string, updates: Partial<Habit>) => {
    try {
      const updatedHabit = await dataService.updateHabit(habitId, updates);
      setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
      return updatedHabit;
    } catch (error) {
      console.error('Failed to update habit:', error);
      throw new Error('Failed to update habit. Please try again.');
    }
  }, []);

  const deleteHabit = useCallback(async (habitId: string) => {
    try {
      await dataService.deleteHabit(habitId);
      setHabits(prev => prev.filter(h => h.id !== habitId));
      setHabitsWithStats(prev => prev.filter(h => h.id !== habitId));
    } catch (error) {
      console.error('Failed to delete habit:', error);
      throw new Error('Failed to delete habit. Please try again.');
    }
  }, []);

  // Listen for auth changes and reload data
  useEffect(() => {
    const handleAuthChange = async (user: any) => {
      const newUserId = user?.id || null;
      console.log('🔄 useHabits: Auth changed, user ID:', newUserId);
      
      if (newUserId !== currentUserId) {
        setCurrentUserId(newUserId);
        console.log('👤 User changed, reloading habits...');
        
        setLoading(true);
        // Clear existing data first
        setHabits([]);
        setHabitsWithStats([]);
        
        // Load new user's data
        await loadHabits();
        setLoading(false);
      }
    };

    // Add auth listener
    const unsubscribe = authService.addAuthListener(handleAuthChange);
    
    // Initial load
    const initialLoad = async () => {
      const user = await authService.getCurrentUser();
      await handleAuthChange(user);
    };
    
    initialLoad();

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
      console.log('🧹 useHabits cleanup completed');
    };
  }, [currentUserId, loadHabits]);

  return {
    habits,
    habitsWithStats,
    loading,
    refreshing,
    error,
    refresh,
    reload: loadHabits,
    addHabit,
    updateHabit,
    deleteHabit,
  };
};