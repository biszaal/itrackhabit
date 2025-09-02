import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainTabScreenProps } from '../types/navigation';
import { theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, dataService } from '../services/core';
import { timerService } from '../services/habits';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { NeumorphCard, NeumorphismColors, getRandomHabitColor } from '../components/neumorphism';
import { useSmartNotifications } from '../hooks/useSmartNotifications';

type HomeScreenProps = MainTabScreenProps<'Home'>;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const { recordActivity, onHabitCompleted, refreshNotifications } = useSmartNotifications();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [habits, setHabits] = useState<any[]>([]);
  const [dailyProgress, setDailyProgress] = useState({ completed: 0, total: 0 });
  const [greeting, setGreeting] = useState('Good day!');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isToday, setIsToday] = useState(true);
  const [timerUpdate, setTimerUpdate] = useState(0);

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  // Listen for timer updates to refresh progress display
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerUpdate(prev => prev + 1);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Force re-render when timer updates occur
  useEffect(() => {
    // The timerUpdate state changes every second, triggering a re-render
    // This ensures the UI stays in sync with timer changes
  }, [timerUpdate]);

  // Reload data when screen comes into focus (e.g., returning from timer or edit)
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [isAuthenticated, selectedDate])
  );

  // Update isToday when selectedDate changes
  useEffect(() => {
    const today = new Date();
    const isCurrentDay = selectedDate.toDateString() === today.toDateString();
    setIsToday(isCurrentDay);
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Set dynamic greeting
      const hour = new Date().getHours();
      const greetingText = hour < 12 ? 'Good morning!' : 
                          hour < 18 ? 'Good afternoon!' : 'Good evening!';
      setGreeting(greetingText);
      
      // Load habits using DataService (works offline and online)
      await dataService.initialize();
      const habitsData = await dataService.getHabits();
      
      // Load progress for selected date
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      const habitsWithProgress = await Promise.all(
        habitsData.map(async (habit) => {
          const progress = await dataService.getHabitProgressForDate(habit.id, selectedDateStr);
          return {
            ...habit,
            isDoneToday: progress?.status === 'done',
            currentProgress: progress,
            completionStatus: progress?.status || 'not_done',
          };
        })
      );

      setHabits(habitsWithProgress);
      
      // Calculate progress for selected date
      const completed = habitsWithProgress.filter(habit => habit.isDoneToday).length;
      
      setDailyProgress({
        completed,
        total: habitsWithProgress.length
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      setHabits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHabit = () => {
    navigation.navigate('HabitTemplates');
  };

  const handleOpenHabit = async (habitId: string) => {
    // Record user activity for smart notifications
    await recordActivity(habitId, 'viewed_habit');
    navigation.navigate('HabitTimer', { habitId });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const formatSelectedDate = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (selectedDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (selectedDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return selectedDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const calculateProgressPercentage = () => {
    return dailyProgress.total > 0 
      ? Math.round((dailyProgress.completed / dailyProgress.total) * 100) 
      : 0;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getDefaultEmoji = (title: string): string => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('run')) return '🏃';
    if (titleLower.includes('read')) return '📖';
    if (titleLower.includes('book')) return '📚';
    if (titleLower.includes('meditat')) return '🧘';
    if (titleLower.includes('exercise')) return '💪';
    if (titleLower.includes('walk')) return '🚶';
    if (titleLower.includes('sleep')) return '🛏️';
    if (titleLower.includes('water')) return '💧';
    if (titleLower.includes('yoga')) return '🧘';
    if (titleLower.includes('gym')) return '🏋️';
    if (titleLower.includes('bike') || titleLower.includes('cycl')) return '🚴';
    if (titleLower.includes('swim')) return '🏊';
    if (titleLower.includes('write') || titleLower.includes('journal')) return '✍️';
    if (titleLower.includes('music')) return '🎵';
    if (titleLower.includes('cook')) return '👨‍🍳';
    return '🎯'; // Default emoji
  };

  const renderHabit = ({ item }: { item: any }) => {
    // For HabitWithStats, we have targetConfig and isDoneToday
    const targetValue = item.targetConfig?.targetValue || 1;
    const unit = item.targetConfig?.unit || 'times';
    const isCompleted = item.isDoneToday;
    const isTimeBased = item.targetConfig?.isTimeBased || false;
    
    // Get saved progress
    let currentValue = item.currentProgress?.currentValue || 0;
    
    // Check for active timer progress
    const activeTimer = timerService.getTimer(item.id);
    if (activeTimer && isTimeBased && isToday) {
      // For time-based habits, use timer progress if it's greater than saved progress
      const timerMinutes = Math.floor(activeTimer.currentTime / 60);
      // If timer is reset (currentTime is 0), don't override saved progress unless saved progress is also 0
      if (activeTimer.currentTime === 0 && !activeTimer.isRunning && !activeTimer.isPaused) {
        // Timer was reset, show 0 progress
        currentValue = 0;
      } else {
        // Timer is active or has progress, use the maximum of saved vs timer progress
        currentValue = Math.max(currentValue, timerMinutes);
      }
    }
    
    const progressPercentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;
    const displayEmoji = item.emoji || getDefaultEmoji(item.title);
    
    return (
      <TouchableOpacity onPress={() => handleOpenHabit(item.id)}>
        <NeumorphCard variant="convex" size="medium" style={styles.habitCard}>
          <View style={styles.habitCardContent}>
            <View style={styles.habitMainInfo}>
              <View style={styles.habitColorIndicator}>
                {displayEmoji ? (
                  <Text style={styles.habitTitle}>{displayEmoji}</Text>
                ) : (
                  <View 
                    style={[
                      styles.colorDot, 
                      { backgroundColor: item.color || NeumorphismColors.habitColors.sage }
                    ]} 
                  />
                )}
              </View>
              <View style={styles.habitInfo}>
                <Text style={styles.habitTitle}>{item.title}</Text>
                <Text style={styles.progressText}>
                  {item.targetConfig?.isTimeBased ? `${targetValue} min` : `${targetValue} ${unit}`}
                </Text>
              </View>
            </View>
            <View style={styles.progressInfo}>
              <Text style={[
                styles.progressText,
                isCompleted && styles.completedText
              ]}>
                {isCompleted ? '✓ Done' : `${currentValue}/${targetValue}`}
              </Text>
            </View>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              {progressPercentage > 0 && (
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: item.color || NeumorphismColors.habitColors.sage
                    }
                  ]} 
                />
              )}
            </View>
          </View>
        </NeumorphCard>
      </TouchableOpacity>
    );
  };

  const formatDate = () => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };


  const renderHeader = () => (
    <View style={styles.header}>
      {/* Greeting Card */}
      <NeumorphCard variant="convex" size="medium" style={styles.greetingCard}>
        <View style={styles.greetingContent}>
          <Text style={styles.greetingText}>{greeting}</Text>
          <Text style={styles.dateText}>{formatDate()}</Text>
        </View>
      </NeumorphCard>
      
      {/* Date Navigation & Progress */}
      <View style={styles.navigationProgressRow}>
        <NeumorphCard variant="subtle" style={styles.dateNavCard}>
          <TouchableOpacity 
            onPress={() => navigateDate('prev')}
            style={styles.navButton}
          >
            <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={goToToday} style={styles.dateDisplay}>
            <Text style={styles.dateDisplayText}>{formatSelectedDate()}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => navigateDate('next')}
            style={styles.navButton}
            disabled={isToday}
          >
            <Ionicons 
              name="chevron-forward" 
              size={18} 
              color={isToday ? theme.colors.textSecondary : theme.colors.text} 
            />
          </TouchableOpacity>
        </NeumorphCard>

        <NeumorphCard variant="convex" style={styles.progressMiniCard}>
          <Text style={styles.progressPercentage}>{calculateProgressPercentage()}%</Text>
          <Text style={styles.progressMiniText}>
            {dailyProgress.completed}/{dailyProgress.total}
          </Text>
        </NeumorphCard>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Habits</Text>
        <Text style={styles.sectionSubtitle}>{habits.length}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabit}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />
      
      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleCreateHabit}
      >
        <Ionicons name="add" size={32} color={theme.colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NeumorphismColors.background,
  },
  content: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  greetingCard: {
    marginBottom: theme.spacing.md,
  },
  greetingContent: {
    alignItems: 'center',
  },
  greetingText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  dateText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  navigationProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  dateNavCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  navButton: {
    padding: theme.spacing.xs,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  dateDisplayText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  progressMiniCard: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minWidth: 80,
  },
  progressPercentage: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  progressMiniText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  card: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    // Let neumorphism component handle all styling
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  habitMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitColorIndicator: {
    marginRight: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    // Neumorphic effect for color dot
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  habitDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  progressInfo: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  completedText: {
    color: theme.colors.success || '#22c55e',
  },
  progressBarContainer: {
    marginTop: theme.spacing.md,
    paddingHorizontal: 0,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#D1D9E6',
    borderRadius: 3,
    overflow: 'hidden',
    // Inset neumorphism for progress bar
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: -2,
    borderWidth: 1,
    borderColor: '#C5CCD6',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    // Subtle neumorphism elevation for progress fill
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 180, // Lifted much higher to clear the neumorphic tab bar
    right: 24,
    width: 64, // Slightly larger
    height: 64,
    borderRadius: 32,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    // Enhanced neumorphism effects
    shadowColor: '#A3B1C6',
    shadowOffset: {
      width: 10,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 15,
    // Dual shadow effect with light shadow
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    // Add a subtle inner glow effect
    overflow: 'hidden',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  dateNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  // New compact styles
  compactCard: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.xs,
    backgroundColor: NeumorphismColors.surface,
    borderRadius: theme.borderRadius.md,
    // Subtle neumorphic effect
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compactCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  compactColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.md,
  },
  compactHabitTitle: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  // Updated habit card styles
  habitCard: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
  },
  habitCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});