import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HabitCard, ProgressiveHabitCard, OfflineIndicator } from '../components';
import { SimpleAnimatedCard } from '../components/SimpleAnimatedCard';
import { SimpleFAB } from '../components/SimpleFAB';
import { theme } from '../theme';
import { HabitWithStats, DailyStats } from '../types';
import { MainTabScreenProps } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/ApiService';
import { dataService } from '../services/DataService';
import { useAuth } from '../contexts/AuthContext';

type HomeScreenProps = MainTabScreenProps<'Home'>;


export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [dateLabel, setDateLabel] = useState('Today');
  const [userStats, setUserStats] = useState<any>(null);
  const [weekDates, setWeekDates] = useState<Array<{day: string, date: number, isToday: boolean}>>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    date: new Date().toISOString().split('T')[0],
    totalHabits: 0,
    completedHabits: 0,
    completionRate: 0,
  });
  const [todayProgress, setTodayProgress] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    initializeData();
    
    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout reached, forcing completion');
        setLoading(false);
        setGreeting('Welcome to iTrackHabit!');
        setDateLabel('Today');
        generateWeekDates();
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Reload habits when screen comes into focus (e.g., returning from timer screen)
  useFocusEffect(
    useCallback(() => {
      console.log('🏠 HomeScreen focused - reloading habits, loading state:', loading);
      if (!loading) { // Only reload if not already loading
        loadHabits();
      }
    }, [loading])
  );

  const initializeData = async () => {
    try {
      console.log('🚀 Starting app initialization...');
      
      // Load habits and user data
      await loadHabits();
      console.log('✅ Habits loaded successfully');
      
      await loadUserData();
      console.log('✅ User data loaded successfully');
      
      generateWeekDates();
      console.log('✅ App initialization completed');
    } catch (error) {
      console.error('❌ Failed to initialize data:', error);
      
      // Set fallback data to prevent infinite loading
      setGreeting('Welcome to iTrackHabit!');
      setDateLabel('Today');
      generateWeekDates();
      
      // Still show empty habits array instead of undefined
      setHabits([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      // Simple greeting based on time of day
      const hour = new Date().getHours();
      const greetingText = hour < 12 ? 'Good morning!' : 
                          hour < 18 ? 'Good afternoon!' : 'Good evening!';
      
      const dateLabelText = 'Today';
      
      setGreeting(greetingText);
      setDateLabel(dateLabelText);
      setUserStats(null); // Will implement stats later
    } catch (error) {
      console.error('Failed to load user data:', error);
      setGreeting('Good day!');
      setDateLabel('Today');
    }
  };

  const generateWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay + 1); // Start from Monday
    
    const weekData = [];
    const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      weekData.push({
        day: dayNames[i],
        date: date.getDate(),
        isToday: date.toDateString() === today.toDateString(),
      });
    }
    
    setWeekDates(weekData);
  };

  const getMoodEmoji = (score?: number): string => {
    if (!score) return '😊';
    if (score >= 5) return '😊';
    if (score >= 4) return '🙂';
    if (score >= 3) return '😐';
    if (score >= 2) return '😔';
    return '😢';
  };

  const loadHabits = async () => {
    try {
      let habitsData: any[] = [];
      
      if (isAuthenticated) {
        // Load from server
        habitsData = await apiService.getHabits();
      } else {
        // Load from local storage
        const localHabitsStr = await AsyncStorage.getItem('local_habits');
        if (localHabitsStr) {
          habitsData = JSON.parse(localHabitsStr);
        } else {
          // Create default local habits for demo
          habitsData = [
            {
              id: '1',
              title: 'Exercise 30 min',
              description: 'Daily exercise routine',
              frequency: 'daily',
              category: 'Health',
              targetConfig: { targetValue: 30, unit: 'minutes', isTimeBased: true },
              streak: 0,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: '2',
              title: 'Drink 8 glasses of water',
              description: 'Stay hydrated',
              frequency: 'daily',
              category: 'Health',
              targetConfig: { targetValue: 8, unit: 'glasses', isTimeBased: false },
              streak: 0,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          // Save to local storage
          await AsyncStorage.setItem('local_habits', JSON.stringify(habitsData));
        }
      }
      
      // Convert to HabitWithStats format
      const habitsWithStats = habitsData.map((habit: any) => ({
        ...habit,
        currentStreak: habit.streak || 0,
        longestStreak: habit.longestStreak || 0,
        completionRate: 0,
        isDoneToday: false,
        totalCompletions: habit.totalCompletions || 0,
        todayProgress: 0,
        weeklyStreak: 0,
        currentValue: 0,
        targetValue: habit.targetConfig?.targetValue || 1,
        unit: habit.targetConfig?.unit || 'times',
        // Ensure healthConfig exists for compatibility
        healthConfig: habit.healthConfig || {
          metricType: habit.targetConfig?.isTimeBased ? 'minutes' : 'count',
          targetValue: habit.targetConfig?.targetValue || 1,
          unit: habit.targetConfig?.unit || 'times'
        }
      }));
      
      setHabits(habitsWithStats);
      
      // Load today's progress from dataService
      const today = new Date().toISOString().split('T')[0];
      const progressMap = new Map();
      
      try {
        // Load progress for each habit
        console.log(`🔍 Loading progress for ${habitsWithStats.length} habits on ${today}`);
        for (const habit of habitsWithStats) {
          try {
            const progress = await dataService.getHabitProgressForDate(habit.id, today);
            console.log(`📊 Progress for ${habit.title} (${habit.id}) on ${today}:`, progress);
            if (progress) {
              progressMap.set(habit.id, progress);
              // Update habit with current progress
              habit.currentValue = progress.currentValue || 0;
              habit.isDoneToday = progress.status === 'done';
              habit.todayProgress = progress.status === 'done' ? 100 : 
                (progress.currentValue && progress.targetValue ? 
                  Math.round((progress.currentValue / progress.targetValue) * 100) : 0);
              
              console.log(`✅ Updated habit ${habit.title}: isDoneToday=${habit.isDoneToday}, status=${progress.status}, currentValue=${progress.currentValue}`);
            } else {
              console.log(`❌ No progress found for ${habit.title} on ${today}`);
            }
          } catch (error) {
            console.error(`Error loading progress for habit ${habit.id}:`, error);
          }
        }
        
        setTodayProgress(progressMap);
        setHabits([...habitsWithStats]); // Re-set with updated progress
      } catch (error) {
        console.error('Error loading progress data:', error);
        setTodayProgress(progressMap);
      }
      
      // Calculate daily stats
      const completedToday = habitsWithStats.filter(h => {
        const progress = progressMap.get(h.id);
        return progress?.status === 'done';
      }).length;
      
      const today = new Date().toISOString().split('T')[0];
      
      setDailyStats({
        date: today,
        totalHabits: habitsWithStats.length,
        completedHabits: completedToday,
        completionRate: habitsWithStats.length > 0 ? Math.round((completedToday / habitsWithStats.length) * 100) : 0,
      });
    } catch (error) {
      console.error('Failed to load habits:', error);
    }
  };

  const handleToggleDone = async (habitId: string) => {
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      const today = new Date().toISOString().split('T')[0];
      const currentProgress = todayProgress.get(habitId);
      const newStatus = currentProgress?.status === 'done' ? 'skip' : 'done';
      
      // Update progress locally for now
      console.log('Toggle habit progress:', { habitId, today, newStatus });
      
      // Reload habits to get updated stats
      await loadHabits();

    } catch (error) {
      console.error('Failed to toggle habit:', error);
      // TODO: Show error toast
    }
  };

  const handleProgressUpdate = async (habitId: string, currentValue: number, status: 'partial' | 'done') => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Update progress locally for now
      console.log('Update habit progress:', { habitId, today, currentValue, status });
      
      // Reload habits to get updated stats
      await loadHabits();

    } catch (error) {
      console.error('Failed to update habit progress:', error);
      // TODO: Show error toast
    }
  };

  const handleOpenHabit = (habitId: string) => {
    navigation.navigate('HabitDetails', { habitId });
  };

  const handleTimerOpen = (habitId: string) => {
    navigation.navigate('HabitTimer', { habitId });
  };

  const handleEditHabit = (habitId: string) => {
    navigation.navigate('EditHabit', { habitId });
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      // Delete from local storage for now
      if (!isAuthenticated) {
        const localHabitsStr = await AsyncStorage.getItem('local_habits');
        if (localHabitsStr) {
          const localHabits = JSON.parse(localHabitsStr);
          const updatedHabits = localHabits.filter((h: any) => h.id !== habitId);
          await AsyncStorage.setItem('local_habits', JSON.stringify(updatedHabits));
        }
      }
      // TODO: Implement server deletion when authenticated
      
      await loadHabits(); // Reload to get updated stats
    } catch (error) {
      console.error('Failed to delete habit:', error);
      // TODO: Show error toast
    }
  };

  const handleCreateHabit = () => {
    navigation.navigate('CreateHabit', {});
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadHabits();
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  // FAB menu items
  const fabMenuItems = [
    {
      id: 'create-habit',
      label: 'New Habit',
      icon: 'add-circle-outline' as const,
      color: theme.colors.primary,
      onPress: handleCreateHabit,
    },
    {
      id: 'import-habits',
      label: 'Import',
      icon: 'download-outline' as const,
      color: theme.colors.accent,
      onPress: () => {
        // TODO: Implement import functionality
        console.log('Import habits');
      },
    },
    {
      id: 'quick-timer',
      label: 'Quick Timer',
      icon: 'timer-outline' as const,
      color: theme.colors.warning,
      onPress: () => {
        // TODO: Implement quick timer
        console.log('Quick timer');
      },
    },
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeText}>{greeting}</Text>
          <Text style={styles.dateText}>{formatDate()}</Text>
        </View>
        <OfflineIndicator />
      </View>
      
      {/* Quick Progress Overview */}
      <View style={styles.progressOverview}>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            <Text style={styles.progressPercentage}>{dailyStats.completionRate}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${dailyStats.completionRate}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressSubtext}>
            {dailyStats.completedHabits} of {dailyStats.totalHabits} 
            {dailyStats.totalHabits === 1 ? ' habit' : ' habits'} completed
          </Text>
        </View>
        
        {userStats?.currentStreak > 0 && (
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={theme.fontSize.md} color={theme.colors.warning} />
            <Text style={styles.streakText}>
              {userStats.currentStreak} {userStats.currentStreak === 1 ? 'day' : 'days'} streak!
            </Text>
          </View>
        )}
      </View>
      
      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Habits</Text>
        <View style={styles.habitCounter}>
          <Text style={styles.sectionSubtitle}>{habits.length}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkbox-outline" size={theme.fontSize.xxxl * 2} color={theme.colors.textMuted} />
      <Text style={styles.emptyTitle}>No habits yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first habit to start building better routines
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleCreateHabit}>
        <Text style={styles.emptyButtonText}>Create Habit</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading your habits...</Text>
      </SafeAreaView>
    );
  }

  // Ultra simple version to debug the _toString error
  const renderHabit = ({ item }: { item: HabitWithStats }) => {
    // Debug log to check if isDoneToday is set correctly
    if (item.title.includes('Exercise')) {
      console.log(`Rendering ${item.title}: isDoneToday=${item.isDoneToday}`);
    }
    
    return (
      <TouchableOpacity 
        style={[
          styles.simpleCard, 
          { borderLeftColor: item.isDoneToday ? '#4CAF50' : theme.colors.primary },
          item.isDoneToday && styles.completedCard
        ]}
        onPress={() => handleOpenHabit(item.id)}
      >
        <View style={styles.cardContent}>
          <View style={styles.habitInfo}>
            <Text style={[
              styles.habitTitle,
              item.isDoneToday && styles.completedTitle
            ]}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={styles.habitDescription}>{item.description}</Text>
            )}
          </View>
          <View style={styles.progressInfo}>
            <Text style={[
              styles.progressText,
              item.isDoneToday && styles.completedProgress
            ]}>
              {item.isDoneToday ? '✓ Complete' : `${item.currentValue || 0}/${item.targetValue}`}
            </Text>
          </View>
        </View>
        {item.isDoneToday && (
          <View style={styles.completionBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        renderItem={renderHabit}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={habits.length === 0 ? styles.emptyContent : styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
      
      <TouchableOpacity 
        style={styles.simpleFab} 
        onPress={handleCreateHabit}
      >
        <Ionicons name="add" size={28} color={theme.colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingBottom: 100,
  },
  emptyContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  dateText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.normal,
    color: theme.colors.textSecondary,
  },
  progressOverview: {
    marginBottom: theme.spacing.xxl,
  },
  progressCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xxl,
    marginBottom: theme.spacing.lg,
    // Removed shadow for debugging
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  progressTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  progressPercentage: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  progressSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.warningLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.warningMuted,
  },
  streakText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.warning,
    marginLeft: theme.spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  habitCounter: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xxl,
  },
  emptyButton: {
    backgroundColor: theme.colors.interactive,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
  },
  emptyButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  // Simple card styles with basic shadow
  simpleCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    // Basic compatible shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressInfo: {
    alignItems: 'center',
  },
  simpleFab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    // Removed shadow for debugging
  },
  completedCard: {
    backgroundColor: '#F8FFF8',
    borderLeftColor: '#4CAF50',
  },
  completedTitle: {
    color: '#2E7D32',
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
    textDecorationColor: '#4CAF50',
  },
  completedProgress: {
    color: '#4CAF50',
    fontWeight: theme.fontWeight.bold,
  },
  completionBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
  },
});