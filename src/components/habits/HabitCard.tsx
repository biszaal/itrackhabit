import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/index';
import { NeumorphCard } from '../neumorphism';
import { Habit, HabitProgress } from '../../types';

export interface HabitCardProps {
  habit: Habit;
  progress?: HabitProgress;
  streak?: number;
  onPress?: () => void;
  onToggle?: (habitId: string) => void;
  showProgress?: boolean;
  compact?: boolean;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  progress,
  streak = 0,
  onPress,
  onToggle,
  showProgress = true,
  compact = false,
}) => {
  const cardStyle = [styles.card, compact && styles.compactCard];
  
  const getStatusColor = () => {
    if (!progress) return theme.colors.textSecondary;
    switch (progress.status) {
      case 'done': return theme.colors.success;
      case 'partial': return theme.colors.warning;
      case 'skip': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = () => {
    if (!progress) return 'ellipse-outline';
    switch (progress.status) {
      case 'done': return 'checkmark-circle';
      case 'partial': return 'remove-circle';
      case 'skip': return 'close-circle';
      default: return 'ellipse-outline';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <NeumorphCard variant="convex" style={cardStyle}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {habit.emoji && <Text style={styles.emoji}>{habit.emoji}</Text>}
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {habit.title}
              </Text>
              {!compact && habit.notes && (
                <Text style={styles.notes} numberOfLines={2}>
                  {habit.notes}
                </Text>
              )}
            </View>
          </View>
          
          {onToggle && (
            <TouchableOpacity 
              onPress={() => onToggle(habit.id)}
              style={styles.toggleButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name={getStatusIcon()} 
                size={compact ? 20 : 24} 
                color={getStatusColor()} 
              />
            </TouchableOpacity>
          )}
        </View>

        {showProgress && !compact && (
          <View style={styles.footer}>
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={16} color={theme.colors.warning} />
              <Text style={styles.streakText}>
                {streak} day{streak !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <View style={styles.frequencyContainer}>
              <Text style={styles.frequencyText}>
                {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
              </Text>
            </View>
          </View>
        )}
      </NeumorphCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  compactCard: {
    paddingVertical: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  notes: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  toggleButton: {
    padding: theme.spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSoft,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginLeft: 4,
  },
  frequencyContainer: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  frequencyText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: theme.fontWeight.medium,
  },
});