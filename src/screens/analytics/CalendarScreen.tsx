import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HabitWithStats } from '../../types';
import { MainTabScreenProps } from '../../types/navigation';
import { theme } from '../../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../../services/core';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/core';
import { offlineStorage } from '../../services/core';
import { 
  NeumorphCard, 
  NeumorphButton, 
  NeumorphismColors 
} from '../../components/neumorphism';

type CalendarScreenProps = MainTabScreenProps<'Calendar'>;

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasProgress: boolean;
  completionRate?: number;
  completedHabits?: { id: string; color: string; title: string }[];
  streakDays?: number;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('Overall');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [userStats, setUserStats] = useState<any>(null);
  const [dailyProgress, setDailyProgress] = useState<Map<string, number>>(new Map());
  const [habitCompletions, setHabitCompletions] = useState<Map<string, { id: string; color: string; title: string }[]>>(new Map());
  const [dailyStreaks, setDailyStreaks] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    loadHabits();
    loadStats();
    loadDailyProgress();
    loadHabitCompletions();
    calculateDailyStreaks();
  }, [currentMonth]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHabits();
      loadDailyProgress();
      loadHabitCompletions();
      calculateDailyStreaks();
    }, [])
  );

  const loadStats = useCallback(async () => {
    try {
      
      // Get stats for the last 90 days to calculate meaningful metrics
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const dailyStats = await dataService.getDailyStats(startDateStr, endDateStr);
      
      if (dailyStats.length === 0) {
        setUserStats({ completionRate: 0, longestStreak: 0, perfectDays: 0 });
        return;
      }
      
      // Calculate overall completion rate
      const totalDaysWithHabits = dailyStats.filter(day => day.totalHabits > 0);
      const averageCompletion = totalDaysWithHabits.length > 0 
        ? Math.round(totalDaysWithHabits.reduce((sum, day) => sum + day.completionRate, 0) / totalDaysWithHabits.length)
        : 0;
      
      // Calculate longest streak and perfect days
      let longestStreak = 0;
      let currentStreak = 0;
      let perfectDays = 0;
      
      // Sort by date for proper streak calculation
      const sortedStats = dailyStats
        .filter(day => day.totalHabits > 0) // Only count days with habits
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      for (const dayStats of sortedStats) {
        if (dayStats.completionRate >= 100) {
          currentStreak++;
          perfectDays++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
      
      const stats = {
        completionRate: averageCompletion,
        longestStreak,
        perfectDays
      };
      
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setUserStats({ completionRate: 0, longestStreak: 0, perfectDays: 0 });
    }
  }, []);

  const loadDailyProgress = useCallback(async () => {
    try {
      const progressMap = new Map<string, number>();
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Get start and end dates for the current month
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, daysInMonth).toISOString().split('T')[0];
      
      // Use getDailyStats to get completion rates for the whole month
      const dailyStats = await dataService.getDailyStats(startDate, endDate);
      
      // Map daily stats to progress map
      for (const dayStats of dailyStats) {
        progressMap.set(dayStats.date, dayStats.completionRate);
      }
      
      setDailyProgress(progressMap);
    } catch (error) {
      console.error('❌ Failed to load daily progress:', error);
      setDailyProgress(new Map());
    }
  }, [currentMonth]);

  const loadHabitCompletions = useCallback(async () => {
    try {
      const completionsMap = new Map<string, { id: string; color: string; title: string }[]>();
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Get start and end dates for the current month
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, daysInMonth).toISOString().split('T')[0];
      
      // Load ALL habits (including deleted) for historical data display
      const habitsData = await dataService.getAllHabitsIncludingDeleted();
      
      // Process each habit to get their progress for the month
      for (const habit of habitsData) {
        const progressData = await offlineStorage.getHabitProgress(habit.id, startDate, endDate);
        
        // Group progress by date, but only for dates when the habit was active
        for (const progress of progressData) {
          if (progress.status === 'done') {
            const dateStr = progress.date;
            
            // Check if habit was active on this date
            const habitCreatedDate = habit.createdAt ? habit.createdAt.split('T')[0] : '1900-01-01';
            const habitDeletedDate = habit.deletedAt ? habit.deletedAt.split('T')[0] : null;
            
            // Only show habit progress if it existed on this date
            const wasActive = dateStr >= habitCreatedDate && 
                             (!habitDeletedDate || dateStr <= habitDeletedDate);
            
            if (wasActive) {
              if (!completionsMap.has(dateStr)) {
                completionsMap.set(dateStr, []);
              }
              
              const completedHabits = completionsMap.get(dateStr)!;
              completedHabits.push({
                id: habit.id,
                color: habit.color || '#A8B5A0', // Default to sage if no color
                title: habit.title
              });
            }
          }
        }
      }
      
      setHabitCompletions(completionsMap);
    } catch (error) {
      console.error('❌ Failed to load habit completions:', error);
      setHabitCompletions(new Map());
    }
  }, [currentMonth]);

  const calculateDailyStreaks = useCallback(async () => {
    try {
      const streakMap = new Map<string, number>();
      
      // Get a broader date range for streak calculation
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      // Start from 3 months ago to properly calculate streaks
      const startDate = new Date(year, month - 3, 1);
      const endDate = new Date(year, month + 1, 0); // End of current month
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Get daily stats for the extended period
      const dailyStats = await dataService.getDailyStats(startDateStr, endDateStr);
      
      // Sort by date to calculate streaks chronologically
      const sortedStats = dailyStats.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Calculate running streaks for each day
      let currentStreak = 0;
      
      for (let i = 0; i < sortedStats.length; i++) {
        const dayStats = sortedStats[i];
        const isCompleteDay = dayStats.completionRate >= 100; // All habits completed (100% or more)
        
        
        if (isCompleteDay) {
          currentStreak++;
          
          // Store the streak on the day it was achieved (not the next day)
          // Use direct string comparison to avoid timezone issues
          const [dateYear, dateMonth] = dayStats.date.split('-').map(Number);
          const dateMonthIndex = dateMonth - 1; // Convert to 0-based month index
          
          
          if (dateMonthIndex === month && dateYear === year) {
            streakMap.set(dayStats.date, currentStreak);
          }
        } else {
          currentStreak = 0;
          
          // Also store 0 streak for incomplete days in current month
          const [dateYear, dateMonth] = dayStats.date.split('-').map(Number);
          const dateMonthIndex = dateMonth - 1; // Convert to 0-based month index
          
          if (dateMonthIndex === month && dateYear === year) {
            streakMap.set(dayStats.date, 0);
          }
        }
      }
      
      setDailyStreaks(streakMap);
    } catch (error) {
      console.error('❌ Failed to calculate daily streaks:', error);
      setDailyStreaks(new Map());
    }
  }, [currentMonth]);

  const loadHabits = useCallback(async () => {
    try {
      // Load habits data using DataService which handles both authenticated and offline users
      const habitsData = await dataService.getHabits();
      
      const habitsWithStats = habitsData.map((habit: any) => ({
        ...habit,
        todayProgress: 0,
        completionRate: 0,
        currentValue: 0
      }));
      setHabits(habitsWithStats);
      
    } catch (error) {
      console.error('❌ Failed to load habits:', error);
      setHabits([]); // Set empty array on error
    }
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        isToday: false,
        hasProgress: false,
      });
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isToday = new Date().toDateString() === currentDate.toDateString();
      // Create timezone-neutral date string to avoid timezone offset issues
      const dateStr = `${year.toString().padStart(4, '0')}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const completionRate = dailyProgress.get(dateStr) || 0;
      const completedHabits = habitCompletions.get(dateStr) || [];
      const streakDays = dailyStreaks.get(dateStr) || 0;
      const hasProgress = completionRate > 0 || completedHabits.length > 0;
      
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday,
        hasProgress,
        completionRate,
        completedHabits,
        streakDays,
      });
    }
    
    // Add next month's leading days to fill the grid
    const totalCells = Math.ceil(days.length / 7) * 7;
    for (let day = 1; days.length < totalCells; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: false,
        hasProgress: false,
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <NeumorphCard variant="subtle" style={styles.navButton}>
        <TouchableOpacity onPress={() => navigateMonth('prev')}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </NeumorphCard>
      
      <Text style={styles.monthYear}>
        {currentMonth.toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' }).replace('/', '/')}
      </Text>
      
      <NeumorphCard variant="subtle" style={styles.navButton}>
        <TouchableOpacity onPress={() => navigateMonth('next')}>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </NeumorphCard>
    </View>
  );
  
  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    return (
      <View style={styles.calendarContainer}>
        {/* Week day headers */}
        <View style={styles.weekDaysRow}>
          {weekDays.map((day, index) => (
            <Text key={index} style={styles.weekDayLabel}>{day}</Text>
          ))}
        </View>
        
        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {days.map((dayData, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.calendarDayWrapper}
            >
              <View style={[
                styles.calendarDay,
                dayData.isToday && styles.todayDay,
              ]}>
              {/* Progress Circle for days with activity */}
              {dayData.hasProgress && dayData.isCurrentMonth && (
                <View style={styles.dayProgressCircle}>
                  <View 
                    style={[
                      styles.dayProgressArc,
                      { 
                        transform: [{ rotate: `${-90 + Math.min(dayData.completionRate || 0, 100) / 100 * 360}deg` }],
                        borderRightColor: (dayData.completionRate || 0) >= 100 ? '#FF6B6B' : 'transparent'
                      }
                    ]}
                  />
                </View>
              )}
              
              <Text style={[
                styles.calendarDayText,
                !dayData.isCurrentMonth && styles.otherMonthText,
                dayData.isToday && styles.todayText,
              ]}>
                {String(dayData.date)}
              </Text>
              
              {/* Today indicator dot */}
              {dayData.isToday && (
                <View style={styles.todayDot} />
              )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  

  const renderProgressCircle = () => {
    const completionRate = userStats?.completionRate || 0;
    
    return (
      <View style={styles.progressSection}>
        <NeumorphCard variant="convex" size="large" style={styles.progressCard}>
          <View style={styles.donutContainer}>
            <View style={styles.donutChart}>
              {/* Background circle */}
              <View style={styles.donutBackground} />
              {/* Progress arc */}
              <View style={[
                styles.donutProgress,
                {
                  transform: [{
                    rotate: `${-90 + Math.min(completionRate || 0, 100) / 100 * 360}deg`
                  }]
                }
              ]} />
            </View>
            <View style={styles.donutCenter}>
              <Text style={styles.progressPercentage}>
                {completionRate}%
              </Text>
              <Text style={styles.progressLabel}>Overall Rate</Text>
            </View>
          </View>
        </NeumorphCard>
        
        <View style={styles.statsRow}>
          <NeumorphCard variant="convex" style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats?.longestStreak || 0}</Text>
            <Text style={styles.statLabel}>Best Streaks</Text>
            <Text style={styles.statIcon}>🔥</Text>
          </NeumorphCard>
          
          <NeumorphCard variant="convex" style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats?.perfectDays || 0}</Text>
            <Text style={styles.statLabel}>Perfect Days</Text>
            <Text style={styles.statIcon}>🎯</Text>
          </NeumorphCard>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Simple Header */}
      <View style={styles.header}>
        <NeumorphCard variant="subtle" style={styles.filterCard}>
          <View style={styles.filterIcon} />
          <Text style={styles.filterText}>Overall</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
        </NeumorphCard>
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderCalendarHeader()}
        {renderCalendar()}
        
        {/* Neumorphic Progress Section */}
        {renderProgressCircle()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NeumorphismColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: NeumorphismColors.background,
  },
  filterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  filterIcon: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B6B',
    marginRight: 8,
  },
  filterArrow: {
    fontSize: 14,
    color: '#666',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  monthYear: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  navArrow: {
    fontSize: 28,
    color: '#333',
    fontWeight: '300',
  },
  calendarContainer: {
    backgroundColor: 'transparent',
    marginHorizontal: 20,
    marginBottom: 30,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
    textAlign: 'center',
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 8,
  },
  todayDay: {
    backgroundColor: NeumorphismColors.darkShadow,
    borderRadius: 8,
    // Neumorphic pressed effect
    shadowColor: NeumorphismColors.lightShadow,
    shadowOffset: { width: -1, height: -1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: -1,
  },
  progressDay: {
    position: 'relative',
  },
  calendarDayText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
    textAlign: 'center',
    minWidth: 20,
  },
  otherMonthText: {
    color: '#CCC',
  },
  todayText: {
    color: 'white',
    fontWeight: '600',
  },
  progressCircleContainer: {
    marginBottom: 40,
  },
  progressFill: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 20,
    borderColor: 'transparent',
    borderTopColor: '#FF6B6B',
    transform: [{ rotate: '45deg' }],
  },
  progressContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
  },
  statUnit: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  dayProgressCircle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFE5E5',
    top: 5,
    left: '50%',
    marginLeft: -20,
  },
  dayProgressArc: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: '#FF6B6B',
    borderRightColor: '#FF6B6B',
    top: -2,
    left: -2,
  },
  todayDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    bottom: 8,
    alignSelf: 'center',
  },
  statsSection: {
  },
  statsGrid: {
    flexDirection: 'row',
  },
  habitIndicatorsContainer: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1,
  },
  habitIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.2,
    shadowRadius: 0.5,
    elevation: 1,
  },
  moreHabitsIndicator: {
    borderRadius: 2,
    paddingHorizontal: 2,
    paddingVertical: 0.5,
    minWidth: 12,
    height: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreHabitsText: {
    fontSize: 8,
    textAlign: 'center',
    lineHeight: 8,
  },
  streakIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 100, 0, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 1,
    minWidth: 16,
    height: 14,
  },
  streakText: {
    fontSize: 8,
    lineHeight: 10,
  },
  streakNumber: {
    fontSize: 8,
    color: 'white',
    marginLeft: 1,
    lineHeight: 10,
  },
  progressSection: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  progressCard: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  progressCircle: {
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  progressLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    position: 'relative',
  },
  statNumber: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  statIcon: {
    fontSize: 18,
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  filterText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginHorizontal: theme.spacing.sm,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayWrapper: {
    width: '14.28%',
    height: 50,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra space to prevent content being hidden behind tab bar
  },
  // New donut chart styles
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  donutChart: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  donutBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: NeumorphismColors.dark,
    position: 'absolute',
  },
  donutProgress: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: theme.colors.primary,
    position: 'absolute',
    transformOrigin: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: NeumorphismColors.surface,
    // Inner neumorphic effect
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: -2,
  },
});