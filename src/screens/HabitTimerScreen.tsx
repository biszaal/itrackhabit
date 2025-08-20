import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  StatusBar,
  Dimensions,
  AppState,
  AppStateStatus,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from 'react-native-svg';
import { RootStackScreenProps } from "../types/navigation";
import { Habit, HabitProgress } from "../types";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from "../services/ApiService";
import { dataService } from "../services/DataService";
import { useAuth } from "../contexts/AuthContext";
import { theme } from "../theme";
import { timerService, GlobalTimerState } from "../services/TimerService";

type HabitTimerScreenProps = RootStackScreenProps<"HabitTimer">;

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentTime: number;
  targetTime: number;
  backgroundStartTime?: number;
}

const CIRCLE_RADIUS = 140;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

export const HabitTimerScreen: React.FC<HabitTimerScreenProps> = ({
  navigation,
  route,
}) => {
  const { habitId } = route.params;
  const { isAuthenticated } = useAuth();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    currentTime: 0,
    targetTime: 30 * 60, // 30 minutes in seconds
  });
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [todayProgress, setTodayProgress] = useState<HabitProgress | null>(
    null
  );

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerStateRef = useRef(timer);

  useEffect(() => {
    loadHabit();
    loadTodayProgress();
    loadTimerFromService();

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Remove listener when component unmounts
      timerService.removeListener(habitId, handleTimerUpdate);
    };
  }, [habitId]);

  // Keep timer state ref updated
  useEffect(() => {
    timerStateRef.current = timer;
  }, [timer]);
  
  // Timer service listener
  const handleTimerUpdate = (globalTimer: GlobalTimerState) => {
    setTimer(prev => ({
      ...prev,
      currentTime: globalTimer.currentTime,
      isRunning: globalTimer.isRunning,
      isPaused: globalTimer.isPaused,
    }));
  };
  
  // Load timer from global service
  const loadTimerFromService = () => {
    const globalTimer = timerService.getTimer(habitId);
    if (globalTimer) {
      setTimer(prev => ({
        ...prev,
        currentTime: globalTimer.currentTime,
        targetTime: globalTimer.targetTime,
        isRunning: globalTimer.isRunning,
        isPaused: globalTimer.isPaused,
      }));
    }
    
    // Add listener for updates
    timerService.addListener(habitId, handleTimerUpdate);
  };

  // Handle app state changes for background timer
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const currentState = timerStateRef.current;
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground
        if (currentState.isRunning && backgroundTimeRef.current) {
          const backgroundDuration = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
          console.log(`App returned from background. Adding ${backgroundDuration} seconds to timer.`);
          
          // Add background time to current time
          setTimer(prev => ({
            ...prev,
            currentTime: prev.currentTime + backgroundDuration
          }));
          
          // Save the updated state
          setTimeout(() => saveTimerState(false), 100);
        }
        backgroundTimeRef.current = null;
      } else if (nextAppState.match(/inactive|background/)) {
        // App is going to background
        if (currentState.isRunning) {
          backgroundTimeRef.current = Date.now();
          console.log('App going to background. Timer continues running.');
          
          // Save current state with background start time
          const timerKey = `timer_state_${habitId}`;
          const timerStateToSave = {
            currentTime: currentState.currentTime,
            targetTime: currentState.targetTime,
            isRunning: true, // Keep as running for background calculation
            isPaused: false,
            backgroundStartTime: backgroundTimeRef.current,
            lastSaved: new Date().toISOString(),
          };
          AsyncStorage.setItem(timerKey, JSON.stringify(timerStateToSave));
        }
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [habitId]);

  // Save timer state when navigating away
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Use the current timer state and save immediately
      const currentState = timerStateRef.current;
      if (currentState.currentTime > 0 || currentState.isRunning) {
        const timerKey = `timer_state_${habitId}`;
        const timerStateToSave = {
          currentTime: currentState.currentTime,
          targetTime: currentState.targetTime,
          isRunning: currentState.isRunning, // Keep running state for background calculation
          isPaused: currentState.isPaused,
          backgroundStartTime: currentState.isRunning ? Date.now() : undefined,
          lastSaved: new Date().toISOString(),
        };
        AsyncStorage.setItem(timerKey, JSON.stringify(timerStateToSave));
        console.log(`Timer state saved on navigation for habit ${habitId}:`, timerStateToSave);
      }
    });

    return unsubscribe;
  }, [navigation, habitId]);

  useEffect(() => {
    if (habit) {
      const isTimeBased =
        habit.targetConfig?.isTimeBased ||
        habit.healthConfig?.metricType?.includes("minutes") ||
        habit.title?.toLowerCase().includes("min");
      
      let target = habit.targetConfig?.targetValue || habit.healthConfig?.targetValue;
      
      // If no explicit target and habit title contains minutes, extract from title
      if (!target && habit.title?.toLowerCase().includes("min")) {
        const match = habit.title.match(/(\d+)\s*min/i);
        target = match ? parseInt(match[1], 10) : 30;
      }
      
      target = target || (isTimeBased ? 30 : 1);

      setTimer((prev) => ({
        ...prev,
        targetTime: isTimeBased ? target * 60 : target, // Convert minutes to seconds if time-based
      }));
    }
  }, [habit]);

  // Auto-save timer state periodically while running
  useEffect(() => {
    let saveInterval: NodeJS.Timeout;
    
    if (timer.isRunning && timer.currentTime > 0) {
      // Save timer state every 15 seconds while running (not debounced)
      saveInterval = setInterval(() => {
        saveTimerState(false);
      }, 15000);
    }
    
    return () => {
      if (saveInterval) {
        clearInterval(saveInterval);
      }
    };
  }, [timer.isRunning]);

  useEffect(() => {
    const progressValue = timer.targetTime > 0 ? timer.currentTime / timer.targetTime : 0;
    const clampedProgress = Math.min(progressValue, 1);
    setProgressPercentage(Math.floor(clampedProgress * 100));
  }, [timer.currentTime, timer.targetTime]);

  const loadHabit = async () => {
    try {
      let foundHabit: Habit | null = null;

      if (isAuthenticated) {
        // Load from server
        const habits = await apiService.getHabits();
        foundHabit = habits.find((h) => h.id === habitId) || null;
      } else {
        // Load from local storage
        const localHabitsStr = await AsyncStorage.getItem('local_habits');
        if (localHabitsStr) {
          const localHabits = JSON.parse(localHabitsStr) as Habit[];
          foundHabit = localHabits.find((h) => h.id === habitId) || null;
        }
      }

      // If habit not found, create default local habit for demo
      if (!foundHabit) {
        foundHabit = {
          id: habitId,
          title: "Exercise 30 min",
          description: "Daily exercise routine",
          frequency: "daily",
          category: "Health",
          targetConfig: {
            targetValue: 30,
            unit: "minutes",
            isTimeBased: true
          },
          healthConfig: {
            metricType: "minutes",
            targetValue: 30,
            unit: "minutes"
          },
          streak: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Save to local storage if not authenticated
        if (!isAuthenticated) {
          const existingHabits = await AsyncStorage.getItem('local_habits');
          const habits = existingHabits ? JSON.parse(existingHabits) : [];
          habits.push(foundHabit);
          await AsyncStorage.setItem('local_habits', JSON.stringify(habits));
        }
      }

      setHabit(foundHabit);

      // Hide navigation header to avoid duplication
      navigation.setOptions({ 
        headerShown: false
      });
    } catch (error) {
      console.error("Failed to load habit:", error);
    }
  };

  const loadTodayProgress = async () => {
    try {
      // For now, use mock progress data until progress API is implemented
      const mockProgress: HabitProgress = {
        id: "1",
        habitId: habitId,
        date: new Date().toISOString().split("T")[0],
        status: "partial",
        currentValue: 0,
        targetValue: 30,
        unit: "minutes",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTodayProgress(mockProgress);
    } catch (error) {
      console.error("Failed to load today progress:", error);
    }
  };

  const saveTimerState = async (debounce: boolean = true) => {
    if (debounce) {
      // Debounce saves to prevent too many calls
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveTimerStateImmediate();
      }, 1000);
    } else {
      await saveTimerStateImmediate();
    }
  };
  
  const saveTimerStateImmediate = async () => {
    try {
      const currentState = timerStateRef.current;
      const timerKey = `timer_state_${habitId}`;
      const timerStateToSave = {
        currentTime: currentState.currentTime,
        targetTime: currentState.targetTime,
        isRunning: currentState.isRunning, // Save actual running state for background detection
        isPaused: currentState.isPaused,
        backgroundStartTime: currentState.isRunning ? Date.now() : undefined,
        lastSaved: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(timerKey, JSON.stringify(timerStateToSave));
      console.log(`Timer state saved for habit ${habitId}:`, timerStateToSave);
    } catch (error) {
      console.error('Failed to save timer state:', error);
    }
  };

  const loadSavedTimerState = async () => {
    try {
      const timerKey = `timer_state_${habitId}`;
      const savedStateStr = await AsyncStorage.getItem(timerKey);
      
      if (savedStateStr) {
        const savedState = JSON.parse(savedStateStr);
        const lastSavedDate = new Date(savedState.lastSaved);
        const today = new Date();
        
        // Only restore state if it was saved today (reset daily)
        if (lastSavedDate.toDateString() === today.toDateString()) {
          let currentTime = savedState.currentTime || 0;
          let isRunning = false;
          let isPaused = savedState.currentTime > 0;
          
          // Check if timer was running in background
          if (savedState.isRunning && savedState.backgroundStartTime) {
            const backgroundDuration = Math.floor((Date.now() - savedState.backgroundStartTime) / 1000);
            currentTime += backgroundDuration;
            console.log(`Timer was running in background for ${backgroundDuration} seconds. Total time: ${currentTime}`);
            
            // Don't auto-resume, but show the accumulated time
            isPaused = true;
          }
          
          setTimer(prev => ({
            ...prev,
            currentTime,
            targetTime: savedState.targetTime || prev.targetTime,
            isRunning,
            isPaused,
          }));
          
          console.log(`Timer state loaded for habit ${habitId}:`, { ...savedState, calculatedTime: currentTime });
          
          // Save the updated state without background time
          if (savedState.backgroundStartTime) {
            setTimeout(() => {
              const updatedState = {
                currentTime,
                targetTime: savedState.targetTime,
                isRunning: false,
                isPaused: true,
                lastSaved: new Date().toISOString(),
              };
              AsyncStorage.setItem(timerKey, JSON.stringify(updatedState));
            }, 100);
          }
        } else {
          // Clear old state if it's from a previous day
          await AsyncStorage.removeItem(timerKey);
          console.log(`Cleared old timer state for habit ${habitId}`);
        }
      }
    } catch (error) {
      console.error('Failed to load saved timer state:', error);
    }
  };

  const clearTimerState = async () => {
    try {
      const timerKey = `timer_state_${habitId}`;
      await AsyncStorage.removeItem(timerKey);
      console.log(`Timer state cleared for habit ${habitId}`);
    } catch (error) {
      console.error('Failed to clear timer state:', error);
    }
  };

  const startTimer = () => {
    if (!timer.isRunning) {
      timerService.startTimer(habitId, timer.targetTime);
    }
  };

  const pauseTimer = () => {
    if (timer.isRunning) {
      timerService.pauseTimer(habitId);
    }
  };

  const resetTimer = async () => {
    timerService.resetTimer(habitId);
  };

  const completeSession = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      console.log('🎯 Completing session for habit ID:', habitId, 'on date:', today);
      const isTimeBased =
        habit?.targetConfig?.isTimeBased ||
        habit?.healthConfig?.metricType?.includes("minutes") ||
        habit?.title?.toLowerCase().includes("min");
      const unit =
        habit?.targetConfig?.unit || habit?.healthConfig?.unit || "times";
      const targetValue =
        habit?.targetConfig?.targetValue ||
        habit?.healthConfig?.targetValue ||
        1;
      // "Complete Session" always completes the full target
      const currentValue = targetValue;
      const status = "done"; // Always mark as done when completing session

      // Save progress to the database
      try {
        await dataService.markHabitProgress(habitId, today, status, {
          currentValue,
          targetValue,
          unit,
          timeSpentSeconds: isTimeBased ? timer.currentTime : undefined,
          notes: undefined,
        });
      } catch (dbError) {
        console.error('Database save failed, using API fallback:', dbError);
        
        // Fallback: Use API service directly
        try {
          await apiService.markHabitProgress(habitId, {
            date: today,
            status,
            currentValue,
            targetValue,
            unit,
          });
        } catch (apiError) {
          console.error('API fallback also failed, saving locally:', apiError);
          
          // Final fallback: Save to AsyncStorage
          try {
            const progressKey = `habit_progress_${habitId}_${today}`;
            const progressData = {
              id: `${habitId}_${today}`,
              habitId,
              date: today,
              status,
              currentValue,
              targetValue,
              unit,
              timeSpentSeconds: isTimeBased ? timer.currentTime : undefined,
              updatedAt: new Date().toISOString(),
              pending: true, // Mark as pending for later sync
            };
            
            await AsyncStorage.setItem(progressKey, JSON.stringify(progressData));
            console.log('Progress saved to local storage as fallback');
          } catch (storageError) {
            console.error('Local storage fallback also failed:', storageError);
            throw new Error('Failed to save progress anywhere - all methods failed');
          }
        }
      }

      console.log('✅ Progress saved successfully:', { 
        habitId, 
        today, 
        currentValue, 
        targetValue,
        status, 
        unit 
      });

      // Pause timer and show completion
      pauseTimer();
      
      // Clear saved timer state since session is complete
      await clearTimerState();

      // Fix plural form for units
      const unitDisplay = currentValue === 1 ? unit.replace(/s$/, '') : unit;
      const message =
        targetValue === 1
          ? `Great work! Habit completed for today.`
          : `Great work! You completed the full ${currentValue} ${unitDisplay} session!`;

      Alert.alert("Session Complete!", message, [
        { text: "Continue", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Failed to complete session:", error);
      Alert.alert("Error", "Failed to save your progress. Please try again.");
    }
  };

  const handleManualAdd = async () => {
    const value = parseFloat(manualValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid number");
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];
      const isTimeBased =
        habit?.targetConfig?.isTimeBased ||
        habit?.healthConfig?.metricType?.includes("minutes") ||
        habit?.title?.toLowerCase().includes("min");
      const unit =
        habit?.targetConfig?.unit || habit?.healthConfig?.unit || "units";
      const targetValue =
        habit?.targetConfig?.targetValue ||
        habit?.healthConfig?.targetValue ||
        30;

      const currentValue = (todayProgress?.currentValue || 0) + value;
      const status = currentValue >= targetValue ? "done" : "partial";

      // Save manual progress to the database
      try {
        await dataService.markHabitProgress(habitId, today, status, {
          currentValue,
          targetValue,
          unit,
          timeSpentSeconds: isTimeBased ? currentValue * 60 : undefined,
          notes: `Manual entry: +${value}`,
        });
      } catch (error) {
        console.error('Failed to save manual progress:', error);
        Alert.alert('Error', 'Failed to save your progress. Please try again.');
        return;
      }
      
      console.log('Manual progress saved:', { habitId, today, currentValue, status, unit });

      // Update timer display
      setTimer((prev) => ({
        ...prev,
        currentTime: isTimeBased ? currentValue * 60 : currentValue,
      }));

      setShowManualInput(false);
      setManualValue("");
      await loadTodayProgress();
    } catch (error) {
      console.error("Failed to add manual progress:", error);
      Alert.alert("Error", "Failed to save your progress. Please try again.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Progress percentage state
  const [progressPercentage, setProgressPercentage] = useState(0);

  const getProgressColor = () => {
    const progressValue = timer.targetTime > 0 ? timer.currentTime / timer.targetTime : 0;
    if (progressValue >= 1) return theme.colors.success;
    if (progressValue >= 0.5) return theme.colors.warning;
    return theme.colors.primary;
  };

  const isTimeBased =
    habit?.targetConfig?.isTimeBased ||
    habit?.healthConfig?.metricType?.includes("minutes") ||
    habit?.title?.toLowerCase().includes("min");
  const unit =
    habit?.targetConfig?.unit || habit?.healthConfig?.unit || (isTimeBased ? "minutes" : "times");
  const targetValue =
    habit?.targetConfig?.targetValue || habit?.healthConfig?.targetValue || (isTimeBased ? 30 : 1);
  const currentValue = isTimeBased
    ? Math.floor(timer.currentTime / 60)
    : timer.currentTime;

  if (!habit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading habit...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const backgroundColor = '#2196F3'; // Consistent blue background

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{habit.title}</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Main Timer Area */}
      <View style={styles.timerContainer}>
        <View style={styles.progressCircle}>
          {/* SVG Progressive Circle */}
          <Svg width={320} height={320} style={styles.svgCircle}>
            {/* Background Circle */}
            <Circle
              cx={160}
              cy={160}
              r={CIRCLE_RADIUS}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={15}
              fill="transparent"
            />
            {/* Progressive Circle */}
            <Circle
              cx={160}
              cy={160}
              r={CIRCLE_RADIUS}
              stroke="white"
              strokeWidth={8}
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={CIRCLE_CIRCUMFERENCE}
              strokeDashoffset={CIRCLE_CIRCUMFERENCE * (1 - (progressPercentage / 100))}
              transform="rotate(-90 160 160)"
            />
          </Svg>

          {/* Center Content */}
          <View style={styles.timerContent}>
            {isTimeBased ? (
              <>
                <Text style={styles.timerText}>
                  {formatTime(timer.currentTime)}
                </Text>
                <Text style={styles.unitText}>
                  / {formatTime(timer.targetTime)}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.valueText}>{currentValue}</Text>
                {targetValue > 1 ? (
                  <Text style={styles.unitText}>
                    / {targetValue} {unit}
                  </Text>
                ) : (
                  <Text style={styles.unitText}>{unit}</Text>
                )}
              </>
            )}
            
            {/* Progress Percentage */}
            <Text style={styles.progressPercentageText}>{progressPercentage}%</Text>
          </View>
        </View>
      </View>

      {/* Controls - Always show timer controls for time-based habits */}
      <View style={styles.controls}>
        {isTimeBased ? (
          // Timer Controls
          <View style={styles.timerControls}>
            <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
              <Ionicons name="refresh" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playButton}
              onPress={timer.isRunning ? pauseTimer : startTimer}
            >
              <Ionicons
                name={timer.isRunning ? "pause" : "play"}
                size={32}
                color={backgroundColor}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowManualInput(true)}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          // Manual Entry Controls
          <View style={styles.manualControls}>
            {targetValue > 1 && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowManualInput(true)}
              >
                <Text style={styles.addButtonText}>Add {unit}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.completeButton,
                targetValue === 1 && styles.singleCompleteButton,
              ]}
              onPress={completeSession}
            >
              {targetValue === 1 ? (
                <Text style={styles.singleCompleteText}>Complete</Text>
              ) : (
                <Ionicons name="checkmark" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="time-outline" size={24} color="white" />
          <Text style={styles.tabLabel}>Style</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="musical-note-outline" size={24} color="white" />
          <Text style={styles.tabLabel}>Sound</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="timer-outline" size={24} color="white" />
          <Text style={styles.tabLabel}>Countdown</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="document-text-outline" size={24} color="white" />
          <Text style={styles.tabLabel}>Memo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="stats-chart-outline" size={24} color="white" />
          <Text style={styles.tabLabel}>Stat</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Complete Button (for timer) */}
      {isTimeBased && timer.currentTime > 0 && (
        <TouchableOpacity
          style={styles.floatingComplete}
          onPress={completeSession}
        >
          <Text style={styles.floatingCompleteText}>Complete Session</Text>
        </TouchableOpacity>
      )}

      {/* Manual Input Modal */}
      <Modal
        visible={showManualInput}
        transparent
        animationType="slide"
        onRequestClose={() => setShowManualInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              How many {unit} have you completed?
            </Text>
            <TextInput
              style={styles.modalInput}
              value={manualValue}
              onChangeText={setManualValue}
              keyboardType="numeric"
              placeholder={`Enter ${unit}...`}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowManualInput(false);
                  setManualValue("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleManualAdd}
              >
                <Text style={styles.confirmButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  progressCircle: {
    width: 320,
    height: 320,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  svgCircle: {
    position: "absolute",
  },
  timerContent: {
    alignItems: "center",
  },
  timerText: {
    fontSize: 64,
    fontWeight: "200",
    color: "white",
    fontFamily: "System",
    letterSpacing: -2,
  },
  valueText: {
    fontSize: 64,
    fontWeight: "200",
    color: "white",
    fontFamily: "System",
    letterSpacing: -2,
  },
  unitText: {
    fontSize: theme.fontSize.lg,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: theme.spacing.sm,
    fontWeight: theme.fontWeight.medium,
  },
  progressPercentageText: {
    fontSize: theme.fontSize.sm,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    position: 'absolute',
    bottom: -theme.spacing.xl,
  },
  controls: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  timerControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.xxl,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  manualControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.lg,
  },
  addButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 28,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
  },
  addButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: "white",
  },
  completeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  singleCompleteButton: {
    flex: 1,
    width: "auto",
    paddingHorizontal: theme.spacing.xl,
    height: 56,
  },
  singleCompleteText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: "white",
  },
  floatingComplete: {
    position: "absolute",
    bottom: 220, // Move even higher to clear timer controls
    left: theme.spacing.xl,
    right: theme.spacing.xl,
    backgroundColor: "white",
    borderRadius: 28,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  floatingCompleteText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: "#2196F3",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: "100%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
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
    color: "white",
  },
  bottomTabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  tabLabel: {
    fontSize: theme.fontSize.xs,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: theme.spacing.xs / 2,
    fontWeight: theme.fontWeight.medium,
  },
});
