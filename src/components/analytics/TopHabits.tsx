import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/index';
import { NeumorphCard } from '../neumorphism';
import { HabitWithStats } from '../../types';

interface TopHabitsProps {
  habits: HabitWithStats[];
  title?: string;
  limit?: number;
}

interface HabitItemProps {
  habit: HabitWithStats;
  rank: number;
}

const HabitItem: React.FC<HabitItemProps> = ({ habit, rank }) => (
  <View style={styles.habitItem}>
    <View style={styles.habitRank}>
      <Text style={styles.rankText}>#{rank}</Text>
    </View>
    <View style={styles.habitInfo}>
      <Text style={styles.habitTitle}>{habit.title}</Text>
      <Text style={styles.habitSubtitle}>
        {Math.round(habit.completionRate)}% completed
      </Text>
    </View>
    <View style={styles.habitStreak}>
      <Ionicons name="flame" size={16} color={theme.colors.warning} />
      <Text style={styles.streakText}>{habit.currentStreak}</Text>
    </View>
  </View>
);

export const TopHabits: React.FC<TopHabitsProps> = ({ 
  habits, 
  title = "Top Performing Habits", 
  limit = 5 
}) => {
  const topHabits = habits
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, limit);

  if (topHabits.length === 0) {
    return (
      <NeumorphCard variant="convex" style={styles.listCard}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No habits to display yet</Text>
        </View>
      </NeumorphCard>
    );
  }

  return (
    <NeumorphCard variant="convex" style={styles.listCard}>
      <Text style={styles.title}>{title}</Text>
      {topHabits.map((habit, index) => (
        <HabitItem key={habit.id} habit={habit} rank={index + 1} />
      ))}
    </NeumorphCard>
  );
};

const styles = StyleSheet.create({
  listCard: {
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  habitRank: {
    width: 30,
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  rankText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  habitSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  habitStreak: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginLeft: 4,
  },
  emptyState: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
});