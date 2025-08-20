import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit, HabitProgress } from '../types';
import { theme } from '../theme';

interface ProgressiveHabitCardProps {
  habit: Habit;
  todayProgress?: HabitProgress;
  onUpdateProgress: (habitId: string, currentValue: number, status: 'partial' | 'done') => void;
  onOpen: (habitId: string) => void;
  onTimerOpen?: (habitId: string) => void;
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

export const ProgressiveHabitCard: React.FC<ProgressiveHabitCardProps> = ({
  habit,
  todayProgress,
  onUpdateProgress,
  onOpen,
  onTimerOpen,
}) => {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const icon = getHabitIcon(habit.title, habit.type);
  
  // Get target from either health config or target config
  const getTarget = () => {
    if (habit.healthConfig) {
      return {
        value: habit.healthConfig.targetValue,
        unit: habit.healthConfig.unit,
      };
    }
    if (habit.targetConfig?.hasTarget) {
      return {
        value: habit.targetConfig.targetValue || 0,
        unit: habit.targetConfig.unit || '',
      };
    }
    return null;
  };

  const target = getTarget();
  const currentValue = todayProgress?.currentValue || 0;
  const isCompleted = todayProgress?.status === 'done';
  const hasPartialProgress = todayProgress?.status === 'partial' && currentValue > 0;

  // Calculate progress percentage
  const progressPercentage = target 
    ? Math.min(100, (currentValue / target.value) * 100)
    : (isCompleted ? 100 : 0);

  const handleProgressInput = () => {
    if (!target) return;
    
    const value = parseFloat(inputValue);
    if (isNaN(value) || value < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number');
      return;
    }
    
    if (value > target.value) {
      Alert.alert(
        'Exceed Target',
        `You've entered ${value} ${target.unit}, which exceeds your target of ${target.value} ${target.unit}. Mark as complete?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Complete', 
            onPress: () => {
              onUpdateProgress(habit.id, target.value, 'done');
              setShowInput(false);
              setInputValue('');
            }
          },
        ]
      );
      return;
    }
    
    const status = value >= target.value ? 'done' : 'partial';
    onUpdateProgress(habit.id, value, status);
    setShowInput(false);
    setInputValue('');
  };

  const handleQuickComplete = () => {
    if (target) {
      onUpdateProgress(habit.id, target.value, 'done');
    } else {
      // For habits without targets, just mark as done
      onUpdateProgress(habit.id, 1, 'done');
    }
  };

  const getProgressColor = () => {
    if (isCompleted) return theme.colors.success;
    if (hasPartialProgress) return theme.colors.warning;
    return theme.colors.borderSoft;
  };

  const getProgressText = () => {
    if (!target) {
      return isCompleted ? 'Completed' : 'Not started';
    }
    
    if (isCompleted) {
      return `${target.value} ${target.unit} - Complete!`;
    }
    
    if (hasPartialProgress) {
      return `${currentValue} / ${target.value} ${target.unit}`;
    }
    
    return `Target: ${target.value} ${target.unit}`;
  };

  const handleCardPress = () => {
    console.log('Habit clicked:', habit.title);
    console.log('Target config:', habit.targetConfig);
    console.log('Health config:', habit.healthConfig);
    console.log('Has timer open handler:', !!onTimerOpen);
    
    // Always open timer screen for all habits with targets if timer handler is available
    if (onTimerOpen) {
      console.log('Opening timer for:', habit.title);
      onTimerOpen(habit.id);
    } else {
      console.log('Opening details for:', habit.title);
      onOpen(habit.id);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleCardPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon.name} size={theme.fontSize.lg + 2} color={icon.color} />
        </View>
        
        <View style={styles.habitInfo}>
          <Text style={[
            styles.habitTitle,
            isCompleted && styles.habitTitleCompleted
          ]}>
            {habit.title}
          </Text>
          <Text style={styles.progressText}>{getProgressText()}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          {target && !isCompleted && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowInput(true)}
            >
              <Ionicons name="add" size={theme.fontSize.md} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[
              styles.checkButton,
              isCompleted && styles.checkButtonActive
            ]}
            onPress={handleQuickComplete}
          >
            {isCompleted && (
              <Ionicons name="checkmark" size={theme.fontSize.md} color={theme.colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Progress bar */}
      {target && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: getProgressColor(),
                }
              ]} 
            />
          </View>
        </View>
      )}
      
      {/* Input modal overlay */}
      {showInput && target && (
        <View style={styles.inputOverlay}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              How many {target.unit} have you completed?
            </Text>
            <TextInput
              style={styles.textInput}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="numeric"
              placeholder={`Enter ${target.unit}...`}
              autoFocus
            />
            <View style={styles.inputButtons}>
              <TouchableOpacity 
                style={[styles.inputButton, styles.cancelButton]}
                onPress={() => {
                  setShowInput(false);
                  setInputValue('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.inputButton, styles.confirmButton]}
                onPress={handleProgressInput}
              >
                <Text style={styles.confirmButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      {/* Completion indicator */}
      {isCompleted && (
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  iconContainer: {
    width: theme.spacing.xxl,
    height: theme.spacing.xxl,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
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
  progressText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.normal,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  addButton: {
    width: theme.spacing.xl,
    height: theme.spacing.xl,
    borderRadius: theme.spacing.xl / 2,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButton: {
    width: theme.spacing.xl,
    height: theme.spacing.xl,
    borderRadius: theme.spacing.xl / 2,
    borderWidth: 2,
    borderColor: theme.colors.borderSoft,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonActive: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  progressTrack: {
    height: theme.spacing.sm,
    backgroundColor: theme.colors.borderSoft,
    borderRadius: theme.borderRadius.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.xs,
    minWidth: 2, // Ensure some progress is visible
  },
  completionIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: theme.spacing.xs,
    backgroundColor: theme.colors.success,
  },
  inputOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.xl,
    minWidth: 280,
  },
  inputLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  inputButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  inputButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  confirmButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
});