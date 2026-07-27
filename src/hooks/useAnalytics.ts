import { useState, useEffect, useCallback } from 'react';
import { dataService } from '../services/core';
import { DailyStats, HabitWithStats } from '../types';
import { toLocalISODate } from '../utils/formatting/time';

export interface AnalyticsData {
  totalHabits: number;
  activeHabits: number;
  totalStreaks: number;
  averageCompletionRate: number;
  weeklyProgress: DailyStats[];
  monthlyProgress: DailyStats[];
  /** Daily stats over the caller's requested window (see `periodDays`). */
  periodProgress: DailyStats[];
  habitStats: HabitWithStats[];
  categoryDistribution: { [key: string]: number };
}

/**
 * @param periodDays Size of the trend window to fetch. The caller's period
 *   selector must drive this — otherwise switching periods only relabels a
 *   chart that keeps showing the same 30 days.
 */
export const useAnalytics = (periodDays: number = 30) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateDateRanges = useCallback(() => {
    const today = new Date();
    const daysAgo = (n: number) => new Date(today.getTime() - n * 24 * 60 * 60 * 1000);

    return {
      today: toLocalISODate(today),
      weekAgo: toLocalISODate(daysAgo(7)),
      monthAgo: toLocalISODate(daysAgo(30)),
      periodAgo: toLocalISODate(daysAgo(periodDays)),
    };
  }, [periodDays]);

  const calculateCategoryDistribution = useCallback((habits: any[]) => {
    const categoryDistribution: { [key: string]: number } = {};
    habits.forEach((habit: any) => {
      const category = habit.category || 'Other';
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    });
    return categoryDistribution;
  }, []);

  const calculateAggregateStats = useCallback((activeHabits: any[]) => {
    const totalStreaks = activeHabits.reduce((sum: number, habit: any) => sum + habit.currentStreak, 0);
    const averageCompletionRate = activeHabits.length > 0 
      ? activeHabits.reduce((sum, habit) => sum + habit.completionRate, 0) / activeHabits.length
      : 0;
    
    return { totalStreaks, averageCompletionRate };
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      setError(null);
      await dataService.initialize();
      
      const habits = await dataService.getHabitsWithStats();
      const activeHabits = habits.filter((h: any) => !h.deletedAt);
      
      const { today, weekAgo, monthAgo, periodAgo } = calculateDateRanges();

      const [weeklyProgress, monthlyProgress, periodProgress] = await Promise.all([
        dataService.getDailyStats(weekAgo, today),
        dataService.getDailyStats(monthAgo, today),
        dataService.getDailyStats(periodAgo, today),
      ]);

      const categoryDistribution = calculateCategoryDistribution(activeHabits);
      const { totalStreaks, averageCompletionRate } = calculateAggregateStats(activeHabits);
      
      setAnalyticsData({
        totalHabits: habits.length,
        activeHabits: activeHabits.length,
        totalStreaks,
        averageCompletionRate,
        weeklyProgress,
        monthlyProgress,
        periodProgress,
        habitStats: activeHabits,
        categoryDistribution
      });
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setError('Failed to load analytics data. Please try again.');
    }
  }, [calculateDateRanges, calculateCategoryDistribution, calculateAggregateStats]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  }, [loadAnalytics]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadAnalytics();
      setLoading(false);
    };
    
    loadData();
  }, [loadAnalytics]);

  return {
    analyticsData,
    loading,
    refreshing,
    error,
    refresh,
    reload: loadAnalytics,
  };
};