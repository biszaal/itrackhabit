import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HabitWithStats } from '../types';
import { theme } from '../theme';

interface HabitCardProps {
  habit: HabitWithStats;
  onToggleDone: (habitId: string) => void;
  onOpen: (habitId: string) => void;
  onTimerOpen?: (habitId: string) => void;
  onEdit?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
}

// Get habit icon based on title/type
const getHabitIcon = (title: string, type: string) => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('read') || lowerTitle.includes('book')) {
    return { name: 'book' as const, color: theme.colors.blue };
  }
  if (lowerTitle.includes('meditat') || lowerTitle.includes('mindful')) {
    return { name: 'leaf' as const, color: theme.colors.orange };
  }
  if (lowerTitle.includes('exercise') || lowerTitle.includes('workout') || lowerTitle.includes('fitness')) {
    return { name: 'fitness' as const, color: theme.colors.purple };
  }
  if (lowerTitle.includes('water') || lowerTitle.includes('drink')) {
    return { name: 'water' as const, color: theme.colors.blue };
  }
  if (lowerTitle.includes('sleep')) {
    return { name: 'moon' as const, color: theme.colors.purple };
  }
  
  // Default icon
  return { name: 'checkmark-circle' as const, color: theme.colors.primary };
};

// Get progress text based on habit type and config
const getProgressText = (habit: HabitWithStats) => {
  if (habit.type === 'health' && habit.healthConfig) {
    const { targetValue, unit } = habit.healthConfig;
    const currentValue = habit.isDoneToday ? targetValue : 0;
    return `${currentValue}/${targetValue}${unit}`;
  }
  
  // For manual habits, show streak or completion
  if (habit.currentStreak > 0) {
    return `${habit.currentStreak} day streak`;
  }
  
  return `${habit.completionRate}% complete`;
};

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onToggleDone,
  onOpen,
  onTimerOpen,
}) => {
  const handleToggleDone = () => {
    onToggleDone(habit.id);
  };

  const handleOpen = () => {
    // Always prefer timer screen if available
    if (onTimerOpen) {
      onTimerOpen(habit.id);
    } else {
      onOpen(habit.id);
    }
  };

  const icon = getHabitIcon(habit.title, habit.type);
  const progressText = getProgressText(habit);
  const progressPercentage = habit.type === 'health' && habit.healthConfig 
    ? (habit.isDoneToday ? 100 : 0)
    : habit.completionRate;

  return (
    <TouchableOpacity style={styles.container} onPress={handleOpen} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <TouchableOpacity 
            style={[
              styles.checkButton,
              habit.isDoneToday && styles.checkButtonActive
            ]}
            onPress={handleToggleDone}
          >
            {habit.isDoneToday && (
              <Ionicons name="checkmark" size={theme.fontSize.lg} color={theme.colors.white} />
            )}
          </TouchableOpacity>
          
          <View style={styles.habitInfo}>
            <Text style={[
              styles.habitTitle,
              habit.isDoneToday && styles.habitTitleCompleted
            ]}>
              {habit.title}
            </Text>
            {habit.notes && (
              <Text style={styles.habitNotes}>{habit.notes}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <Ionicons name={icon.name} size={theme.fontSize.lg + 2} color={icon.color} />
          {habit.currentStreak > 0 && (
            <View style={styles.streakIndicator}>
              <Text style={styles.streakNumber}>{habit.currentStreak}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Subtle completion indicator */}
      {habit.isDoneToday && (
        <View style={styles.completionIndicator} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.colors.borderSoft,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  checkButtonActive: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  habitTitleCompleted: {
    color: theme.colors.textSecondary,
  },
  habitNotes: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
    lineHeight: theme.fontSize.sm * 1.4,
  },
  rightSection: {
    alignItems: 'center',
    position: 'relative',
  },
  streakIndicator: {
    position: 'absolute',
    top: -theme.spacing.sm,
    right: -theme.spacing.sm,
    backgroundColor: theme.colors.warning,
    borderRadius: theme.spacing.sm + 2,
    minWidth: theme.spacing.lg,
    height: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  streakNumber: {
    fontSize: theme.fontSize.xs - 1,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.surface,
  },
  completionIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: theme.spacing.xs,
    backgroundColor: theme.colors.success,
  },
});