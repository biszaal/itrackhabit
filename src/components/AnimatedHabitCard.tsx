import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
// import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg'; // Removed for now
import { theme } from '../theme';
import { HabitWithStats } from '../types';

const { width: screenWidth } = Dimensions.get('window');
const CARD_HEIGHT = 140;
const PROGRESS_SIZE = 80;

interface AnimatedHabitCardProps {
  habit: HabitWithStats;
  index: number;
  onPress?: () => void;
  onTimerPress?: () => void;
  onToggleComplete?: () => void;
  onLongPress?: () => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const AnimatedHabitCard: React.FC<AnimatedHabitCardProps> = ({
  habit,
  index,
  onPress,
  onTimerPress,
  onToggleComplete,
  onLongPress,
}) => {
  // Animation values
  const scale = useSharedValue(0);
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  const progressValue = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Calculate progress percentage
  const progressPercentage = habit.currentValue && habit.targetValue 
    ? Math.min((habit.currentValue / habit.targetValue) * 100, 100)
    : 0;

  // Card entrance animation
  useEffect(() => {
    const delay = index * 100; // Staggered animation
    
    scale.value = withDelay(delay, withSpring(1));
    translateY.value = withDelay(delay, withSpring(0));
    opacity.value = withDelay(delay, withTiming(1, { duration: theme.animation.duration.slow }));
    progressValue.value = withDelay(delay + 200, withSpring(progressPercentage));
  }, [index, progressPercentage]);

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ],
      opacity: opacity.value,
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  // Simplified without gesture handler for now
  // const gestureHandler = useAnimatedGestureHandler({
  //   onStart: (_, context) => {
  //     context.startX = panX.value;
  //     context.startY = panY.value;
  //     cardRotate.value = withSpring(2);
  //   },
  //   onActive: (event, context) => {
  //     panX.value = context.startX + event.translationX * 0.1;
  //     panY.value = context.startY + event.translationY * 0.1;
  //   },
  //   onEnd: () => {
  //     panX.value = withSpring(0);
  //     panY.value = withSpring(0);
  //     cardRotate.value = withSpring(0);
  //   },
  // });

  // Button press animations
  const handleButtonPress = (callback?: () => void) => {
    buttonScale.value = withTiming(0.95, { duration: theme.animation.duration.fast });
    
    setTimeout(() => {
      buttonScale.value = withSpring(1);
      callback?.();
    }, theme.animation.duration.fast);
  };

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

  // Render progress circle - simplified
  const renderProgressCircle = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressCircleBackground}>
          <View style={[styles.progressCircleFill, { 
            transform: [{ 
              rotate: `${(progressPercentage / 100) * 360}deg` 
            }] 
          }]} />
        </View>
        
        <View style={styles.progressContent}>
          <Text style={styles.progressText}>
            {habit.currentValue || 0}
          </Text>
          <Text style={styles.progressUnit}>
            /{habit.targetValue}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Animated.View style={[cardAnimatedStyle]}>
      <AnimatedTouchableOpacity
        style={[styles.card, { borderLeftColor: categoryColor }]}
        onPress={() => handleButtonPress(onPress)}
        onLongPress={onLongPress}
        activeOpacity={0.9}
      >
          {/* Card content */}
          <View style={styles.cardContent}>
            {/* Left side - Habit info */}
            <View style={styles.habitInfo}>
              <View style={styles.habitHeader}>
                <Text style={styles.habitTitle} numberOfLines={1}>
                  {habit.title}
                </Text>
                <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
                  <Text style={[styles.categoryText, { color: categoryColor }]}>
                    {habit.category}
                  </Text>
                </View>
              </View>
              
              {habit.description && (
                <Text style={styles.habitDescription} numberOfLines={2}>
                  {habit.description}
                </Text>
              )}
              
              <View style={styles.habitMeta}>
                <View style={styles.streakContainer}>
                  <Ionicons name="flame" size={16} color={theme.colors.warning} />
                  <Text style={styles.streakText}>{habit.streak || 0} day streak</Text>
                </View>
                
                <Text style={styles.frequencyText}>{habit.frequency}</Text>
              </View>
            </View>
            
            {/* Right side - Progress and actions */}
            <View style={styles.rightSection}>
              {renderProgressCircle()}
              
              <View style={styles.actionButtons}>
                <AnimatedTouchableOpacity
                  style={[styles.actionButton, buttonAnimatedStyle]}
                  onPress={() => handleButtonPress(onTimerPress)}
                >
                  <Ionicons name="timer-outline" size={20} color={theme.colors.primary} />
                </AnimatedTouchableOpacity>
                
                <AnimatedTouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.completeButton,
                    buttonAnimatedStyle,
                    progressPercentage >= 100 && styles.completedButton
                  ]}
                  onPress={() => handleButtonPress(onToggleComplete)}
                >
                  <Ionicons 
                    name={progressPercentage >= 100 ? "checkmark" : "add"} 
                    size={20} 
                    color={theme.colors.white} 
                  />
                </AnimatedTouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Completion overlay */}
          {progressPercentage >= 100 && (
            <Animated.View style={styles.completionOverlay}>
              <View style={styles.completionIndicator}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                <Text style={styles.completionText}>Completed!</Text>
              </View>
            </Animated.View>
          )}
        </AnimatedTouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.card,
    borderLeftWidth: 4,
    ...theme.shadows.card,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  habitInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  habitTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  categoryText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
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
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  frequencyText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textTransform: 'capitalize',
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressContainer: {
    width: PROGRESS_SIZE,
    height: PROGRESS_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressCircleBackground: {
    width: PROGRESS_SIZE,
    height: PROGRESS_SIZE,
    borderRadius: PROGRESS_SIZE / 2,
    backgroundColor: theme.colors.primaryLight,
    position: 'absolute',
  },
  progressCircleFill: {
    width: PROGRESS_SIZE,
    height: PROGRESS_SIZE,
    borderRadius: PROGRESS_SIZE / 2,
    backgroundColor: theme.colors.primary,
    position: 'absolute',
  },
  progressContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  progressUnit: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: -2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  completeButton: {
    backgroundColor: theme.colors.primary,
  },
  completedButton: {
    backgroundColor: theme.colors.success,
  },
  completionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.xl,
  },
  completionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.sm,
  },
  completionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.success,
    marginLeft: theme.spacing.sm,
  },
});