import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { theme } from '../theme';
import { HabitWithStats } from '../types';

interface SimpleAnimatedCardProps {
  habit: HabitWithStats;
  index: number;
  onPress?: () => void;
  onTimerPress?: () => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const SimpleAnimatedCard: React.FC<SimpleAnimatedCardProps> = ({
  habit,
  index,
  onPress,
  onTimerPress,
}) => {
  // Simple animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const scale = useSharedValue(0.9);

  // Calculate progress percentage
  const progressPercentage = habit.currentValue && habit.targetValue 
    ? Math.min((habit.currentValue / habit.targetValue) * 100, 100)
    : 0;

  // Simple entrance animation
  useEffect(() => {
    const delay = index * 150;
    
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(delay, withSpring(0));
    scale.value = withDelay(delay, withSpring(1));
  }, [index]);

  // Animated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Get category color
  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'health': return theme.colors.categoryGreen;
      case 'productivity': return theme.colors.categoryBlue;
      case 'mindfulness': return theme.colors.categoryPurple;
      case 'fitness': return theme.colors.categoryRed;
      case 'learning': return theme.colors.categoryYellow;
      default: return theme.colors.primary;
    }
  };

  const categoryColor = getCategoryColor(habit.category);

  return (
    <AnimatedTouchableOpacity
      style={[styles.card, { borderLeftColor: categoryColor }, animatedStyle]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        {/* Left side - Habit info */}
        <View style={styles.habitInfo}>
          <Text style={styles.habitTitle} numberOfLines={1}>
            {habit.title}
          </Text>
          
          {habit.description && (
            <Text style={styles.habitDescription} numberOfLines={2}>
              {habit.description}
            </Text>
          )}
          
          <View style={styles.habitMeta}>
            <View style={styles.categoryBadge}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {habit.category}
              </Text>
            </View>
            
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={14} color={theme.colors.warning} />
              <Text style={styles.streakText}>{habit.streak || 0} days</Text>
            </View>
          </View>
        </View>
        
        {/* Right side - Progress */}
        <View style={styles.rightSection}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>
              {habit.currentValue || 0}
            </Text>
            <Text style={styles.progressUnit}>
              /{habit.targetValue}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.timerButton}
            onPress={onTimerPress}
          >
            <Ionicons name="timer-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderLeftWidth: 4,
    ...theme.shadows.card,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
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
    marginBottom: theme.spacing.sm,
    lineHeight: 18,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  categoryText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  rightSection: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  progressText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  progressUnit: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: -2,
  },
  timerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});