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
import { apiService } from '../services/ApiService';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

type HomeScreenProps = MainTabScreenProps<'Home'>;

export const BasicHomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [habits, setHabits] = useState<any[]>([]);
  const [dailyProgress, setDailyProgress] = useState({ completed: 0, total: 0 });
  const [greeting, setGreeting] = useState('Good day!');

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  // Reload data when screen comes into focus (e.g., returning from timer)
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [isAuthenticated])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Set dynamic greeting
      const hour = new Date().getHours();
      const greetingText = hour < 12 ? 'Good morning!' : 
                          hour < 18 ? 'Good afternoon!' : 'Good evening!';
      setGreeting(greetingText);
      
      // Load habits from appropriate source
      let habitsData: any[] = [];
      
      if (isAuthenticated) {
        // Load from server
        try {
          habitsData = await apiService.getHabits();
        } catch (error) {
          console.error('Failed to load habits from server:', error);
          habitsData = [];
        }
      } else {
        // Load from local storage
        const localHabitsStr = await AsyncStorage.getItem('local_habits');
        if (localHabitsStr) {
          habitsData = JSON.parse(localHabitsStr);
        } else {
          // Create default local habits
          habitsData = [
            {
              id: '1',
              title: 'Exercise 30 min',
              description: 'Daily exercise routine',
              targetConfig: { targetValue: 30, unit: 'minutes' },
              currentValue: 0,
              targetValue: 30,
            },
            {
              id: '2',
              title: 'Drink 8 glasses of water',
              description: 'Stay hydrated',
              targetConfig: { targetValue: 8, unit: 'glasses' },
              currentValue: 3,
              targetValue: 8,
            },
          ];
          await AsyncStorage.setItem('local_habits', JSON.stringify(habitsData));
        }
      }
      
      // Process habits data and include timer progress
      const processedHabits = await Promise.all(
        habitsData.map(async (habit) => {
          let currentValue = habit.currentValue || 0;
          const targetValue = habit.targetConfig?.targetValue || habit.targetValue || 1;
          
          // Check for saved timer progress for this habit
          try {
            const timerKey = `timer_state_${habit.id}`;
            const savedStateStr = await AsyncStorage.getItem(timerKey);
            
            if (savedStateStr) {
              const savedState = JSON.parse(savedStateStr);
              const lastSavedDate = new Date(savedState.lastSaved);
              const today = new Date();
              
              // Only use timer progress if it was saved today
              if (lastSavedDate.toDateString() === today.toDateString() && savedState.currentTime > 0) {
                const isTimeBased = 
                  habit.targetConfig?.isTimeBased ||
                  habit.title?.toLowerCase().includes('min') ||
                  habit.targetConfig?.unit === 'minutes';
                
                if (isTimeBased) {
                  // Convert seconds to minutes for time-based habits
                  const timerMinutes = Math.floor(savedState.currentTime / 60);
                  currentValue = Math.max(currentValue, timerMinutes);
                  console.log(`Updated habit ${habit.id} (${habit.title}) with timer progress: ${timerMinutes} minutes`);
                } else {
                  // For non-time based habits, use timer value if greater
                  currentValue = Math.max(currentValue, savedState.currentTime);
                  console.log(`Updated habit ${habit.id} (${habit.title}) with timer progress: ${savedState.currentTime}`);
                }
              }
            }
          } catch (error) {
            console.error(`Failed to load timer progress for habit ${habit.id}:`, error);
          }
          
          return {
            ...habit,
            currentValue,
            targetValue,
          };
        })
      );
      
      setHabits(processedHabits);
      
      // Calculate progress
      const completed = processedHabits.filter(habit => 
        habit.currentValue >= habit.targetValue
      ).length;
      
      setDailyProgress({
        completed,
        total: processedHabits.length
      });
      
    } catch (error) {
      console.error('Failed to load data:', error);
      setHabits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHabit = () => {
    navigation.navigate('CreateHabit', {});
  };

  const handleOpenHabit = (habitId: string) => {
    navigation.navigate('HabitTimer', { habitId });
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

  const renderHabit = ({ item }: { item: any }) => {
    const progressPercentage = Math.min((item.currentValue / item.targetValue) * 100, 100);
    const isCompleted = item.currentValue >= item.targetValue;
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => handleOpenHabit(item.id)}
      >
        <View style={styles.cardContent}>
          <View style={styles.habitInfo}>
            <Text style={styles.habitTitle}>{item.title}</Text>
            <Text style={styles.habitDescription}>{item.description}</Text>
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {item.currentValue}/{item.targetValue}
            </Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: isCompleted ? theme.colors.success : theme.colors.primary 
                }
              ]} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const formatDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateProgressPercentage = () => {
    if (dailyProgress.total === 0) return 0;
    return Math.round((dailyProgress.completed / dailyProgress.total) * 100);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>{greeting}</Text>
        <Text style={styles.dateText}>{formatDate()}</Text>
      </View>
      
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Today's Progress</Text>
        <Text style={styles.progressPercentage}>{calculateProgressPercentage()}%</Text>
        <Text style={styles.progressSubtext}>
          {dailyProgress.completed} of {dailyProgress.total} {dailyProgress.total === 1 ? 'habit' : 'habits'} completed
        </Text>
      </View>
      
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
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  welcomeSection: {
    marginBottom: theme.spacing.xl,
  },
  welcomeText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  dateText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  progressCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.xl,
  },
  progressTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  progressPercentage: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  progressSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  card: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  progressBarContainer: {
    marginTop: theme.spacing.md,
    paddingHorizontal: 0,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: theme.colors.borderSoft,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    minWidth: 1, // Ensure at least some progress is visible
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});