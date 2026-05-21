import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/index';
import { NeumorphCard } from '../neumorphism';

export interface StreakCounterProps {
  currentStreak: number;
  bestStreak?: number;
  variant?: 'default' | 'large' | 'compact';
  showBest?: boolean;
  animated?: boolean;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  currentStreak,
  bestStreak,
  variant = 'default',
  showBest = true,
  animated = true,
}) => {
  const getFlameIcon = () => {
    if (currentStreak === 0) return 'flame-outline';
    if (currentStreak < 7) return 'flame';
    if (currentStreak < 30) return 'bonfire';
    return 'flame';
  };

  const getFlameColor = () => {
    if (currentStreak === 0) return theme.colors.textSecondary;
    if (currentStreak < 7) return theme.colors.warning;
    if (currentStreak < 30) return '#FF6B35';
    return '#FF4500';
  };

  const cardStyle = [
    styles.card,
    variant === 'large' && styles.largeCard,
    variant === 'compact' && styles.compactCard,
  ];

  const streakStyle = [
    styles.streakNumber,
    variant === 'large' && styles.largeStreakNumber,
    variant === 'compact' && styles.compactStreakNumber,
  ];

  const iconSize = variant === 'large' ? 32 : variant === 'compact' ? 16 : 24;

  return (
    <NeumorphCard variant="convex" style={cardStyle}>
      <View style={styles.streakContainer}>
        <Ionicons 
          name={getFlameIcon()} 
          size={iconSize} 
          color={getFlameColor()} 
        />
        <Text style={streakStyle}>{currentStreak}</Text>
      </View>
      
      <Text style={styles.label}>Current Streak</Text>
      
      {showBest && bestStreak !== undefined && bestStreak > 0 && (
        <View style={styles.bestContainer}>
          <Text style={styles.bestLabel}>Best: {bestStreak}</Text>
        </View>
      )}
      
      {currentStreak > 0 && (
        <Text style={styles.encouragement}>
          {currentStreak === 1 ? "Great start! 🎉" :
           currentStreak < 7 ? "Keep it up! 💪" :
           currentStreak < 30 ? "On fire! 🔥" :
           "Incredible! 🏆"}
        </Text>
      )}
    </NeumorphCard>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    minHeight: 120,
  },
  largeCard: {
    paddingVertical: theme.spacing.xl,
    minHeight: 150,
  },
  compactCard: {
    paddingVertical: theme.spacing.md,
    minHeight: 80,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  streakNumber: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  largeStreakNumber: {
    fontSize: theme.fontSize.xxxl || 32,
  },
  compactStreakNumber: {
    fontSize: theme.fontSize.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  bestContainer: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  },
  bestLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  encouragement: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    textAlign: 'center',
    fontWeight: theme.fontWeight.medium,
  },
});