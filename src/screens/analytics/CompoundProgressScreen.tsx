import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { dataService } from '../../services/core';
import { atomicHabitsService, CompoundProgress } from '../../services/habits';
import { CompoundProgressCard } from '../../components/CompoundProgressCard';
import { RootStackScreenProps } from '../../types/navigation';
import { Habit } from '../../types';

type CompoundProgressScreenProps = RootStackScreenProps<'CompoundProgress'>;

interface HabitProgressData {
  habit: Habit;
  progress: CompoundProgress;
  logs: any[];
}

export const CompoundProgressScreen: React.FC<CompoundProgressScreenProps> = ({
  navigation,
}) => {
  const [habitProgressData, setHabitProgressData] = useState<HabitProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const habits = await dataService.getHabits();
      const progressData: HabitProgressData[] = [];

      for (const habit of habits) {
        try {
          // Get habit logs for progress calculation
          const logs: any[] = []; // TODO: Implement getHabitLogs or use alternative method
          
          if (logs.length >= 3) { // Need minimum data for meaningful progress
            const progress = atomicHabitsService.calculateCompoundProgress(habit, logs);
            progressData.push({
              habit,
              progress,
              logs,
            });
          }
        } catch (error) {
          console.error(`Error calculating progress for habit ${habit.id}:`, error);
        }
      }

      // Sort by improvement rate (best performers first)
      progressData.sort((a, b) => b.progress.improvementRate - a.progress.improvementRate);
      
      setHabitProgressData(progressData);
    } catch (error) {
      console.error('Error loading progress data:', error);
      Alert.alert('Error', 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProgressData();
    setRefreshing(false);
  }, []);

  const handleViewHabitDetails = (habitId: string) => {
    navigation.navigate('HabitDetails', { habitId });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      
      <View style={styles.titleContainer}>
        <Text style={styles.headerTitle}>Compound Growth</Text>
        <Text style={styles.headerSubtitle}>
          Track your 1% improvements
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trending-up" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyTitle}>Start Tracking Progress</Text>
      <Text style={styles.emptyMessage}>
        Complete habits for at least 3 days to see your compound progress analysis.
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.emptyButtonText}>Start Logging Habits</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Calculating compound progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {habitProgressData.length > 0 ? (
          <View style={styles.habitsSection}>
            <Text style={styles.sectionTitle}>Habit Progress</Text>
            {habitProgressData.map((data) => (
              <CompoundProgressCard
                key={data.habit.id}
                progress={data.progress}
                title={data.habit.title}
                onViewDetails={() => handleViewHabitDetails(data.habit.id)}
              />
            ))}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  habitsSection: {
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  emptyMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  emptyButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});