import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressiveHabitCard } from './ProgressiveHabitCard';
import { theme } from '../theme';

// Demo component to show progressive completion in action
export const ProgressDemo: React.FC = () => {
  const demoHabit = {
    id: 'demo-1',
    userId: 'demo-user',
    title: 'Read Book',
    notes: 'Expand your knowledge through daily reading',
    frequency: 'daily' as const,
    isShared: false,
    type: 'manual' as const,
    targetConfig: {
      hasTarget: true,
      targetValue: 30,
      unit: 'pages',
      isTimeBased: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pending: false,
  };

  const demoProgress = {
    id: 'progress-1',
    habitId: 'demo-1',
    date: new Date().toISOString().split('T')[0],
    status: 'partial' as const,
    currentValue: 15,
    targetValue: 30,
    unit: 'pages',
    updatedAt: new Date().toISOString(),
    pending: false,
  };

  const handleUpdateProgress = (habitId: string, currentValue: number, status: 'partial' | 'done') => {
    console.log(`Updating ${habitId}: ${currentValue} (${status})`);
  };

  const handleOpen = (habitId: string) => {
    console.log(`Opening habit ${habitId}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progressive Completion Demo</Text>
      <Text style={styles.subtitle}>
        This habit shows 50% completion (15/30 pages)
      </Text>
      
      <ProgressiveHabitCard
        habit={demoHabit}
        todayProgress={demoProgress}
        onUpdateProgress={handleUpdateProgress}
        onOpen={handleOpen}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
});