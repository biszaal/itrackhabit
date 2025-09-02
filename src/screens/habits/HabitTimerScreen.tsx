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
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NeumorphCard, NeumorphButton, NeumorphModal, NeumorphInput, NeumorphismColors, ColorPicker } from '../../components/neumorphism';
import { useSmartNotifications } from '../../hooks/useSmartNotifications';
import { RootStackScreenProps } from "../../types/navigation";
import { Habit, HabitProgress } from "../../types";
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { apiService } from "../../services/ApiService";
import { dataService } from "../../services/core";
import { useAuth } from "../../contexts/AuthContext";
import { theme } from "../../theme";
// import { // timerService, any } from "../../services/TimerService";
import { useFocusEffect } from '@react-navigation/native';

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
  const { onHabitCompleted, recordActivity } = useSmartNotifications();
  const insets = useSafeAreaInsets();
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
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleColorChange = async (selectedColor: string) => {
    try {
      if (habit) {
        // Update habit in database using the correct method signature
        const updatedHabit = await dataService.updateHabit(habit.id, { 
          color: selectedColor,
        });
        
        // Update local state
        if (updatedHabit) {
          setHabit(updatedHabit);
        }
      }
      
      // Close modals
      setShowColorPicker(false);
      // setShowMenu(false);
    } catch (error) {
      console.error('Failed to update habit color:', error);
      Alert.alert('Error', 'Failed to update habit color. Please try again.');
    }
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerStateRef = useRef(timer);
  const appState = useRef(AppState.currentState);
  const backgroundTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const initializeScreen = async () => {
      await loadHabit();
      await loadTodayProgress();
      await loadTimerFromService();
    };
    
    initializeScreen();

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Remove listeners when component unmounts
      // timerService.removeListener(habitId, handleTimerUpdate);
      // timerService.removeCompletionListener(habitId, handleTimerCompletion);
    };
  }, [habitId]);

  // Reload habit data when screen comes into focus (e.g., returning from edit)
  useFocusEffect(
    React.useCallback(() => {
      loadHabit();
      loadTodayProgress();
    }, [habitId])
  );

  // Keep timer state ref updated
  useEffect(() => {
    timerStateRef.current = timer;
  }, [timer]);
  
  // Timer service listener
  const handleTimerUpdate = (globalTimer: any) => {
    setTimer(prev => ({
      ...prev,
      currentTime: globalTimer.currentTime,
      isRunning: globalTimer.isRunning,
      isPaused: globalTimer.isPaused,
    }));
  };

  // Handler for timer auto-completion
  const handleTimerCompletion = async (completedHabitId: string, completedTimer: any) => {
    console.log(`🎯 Timer automatically completed for habit ${completedHabitId}`);
    // Automatically complete the session
    try {
      await completeSession();
    } catch (error) {
      console.error('Failed to auto-complete session:', error);
    }
  };
  
  // Load timer from global service
  const loadTimerFromService = async () => {
    // const globalTimer = timerService.getTimer(habitId);
    const globalTimer = null;
    if (globalTimer) {
      // setTimer(prev => ({
      //   ...prev,
      //   currentTime: globalTimer.currentTime,
      //   targetTime: globalTimer.targetTime,
      //   isRunning: globalTimer.isRunning,
      //   isPaused: globalTimer.isPaused,
      // }));
    }
    
    // Load saved timer state from storage
    await loadSavedTimerState();
    
    // Add listener for updates
    // timerService.addListener(habitId, handleTimerUpdate);
    
    // Add listener for timer completion (auto-complete when target reached)
    // timerService.addCompletionListener(habitId, handleTimerCompletion);
  };

  // Handle app state changes for background timer
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const currentState = timerStateRef.current;
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground
        if (currentState.isRunning && backgroundTimeRef.current) {
          const backgroundDuration = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
          
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

  // Save timer state whenever it changes (debounced)
  useEffect(() => {
    if (timer.currentTime > 0 || timer.isRunning) {
      saveTimerState(true); // Debounced save
    }
  }, [timer.currentTime, timer.isRunning, timer.isPaused]);

  const loadHabit = async () => {
    try {
      let foundHabit: Habit | null = null;

      // Use DataService to load habit (works for both authenticated and offline users)
      await dataService.initialize();
      foundHabit = await dataService.getHabitById(habitId);

      // If habit not found, create default local habit for demo
      if (!foundHabit) {
        foundHabit = {
          id: habitId,
          userId: "user_1",
          title: "Exercise 30 min",
          notes: "Daily exercise routine",
          frequency: "daily",
          isShared: false,
          type: "health",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pending: false,
          targetConfig: {
            hasTarget: true,
            targetValue: 30,
            unit: "minutes",
            isTimeBased: true
          },
          healthConfig: {
            metricType: "exercise_minutes",
            targetValue: 30,
            unit: "minutes",
            autoTrack: false
          }
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
        updatedAt: new Date().toISOString(),
        pending: false
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
    } catch (error) {
      console.error('Failed to save timer state:', error);
    }
  };

  const saveManualProgress = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const isTimeBased =
        habit?.targetConfig?.isTimeBased ||
        habit?.healthConfig?.metricType?.includes("minutes") ||
        habit?.title?.toLowerCase().includes("min");
      const unit =
        habit?.targetConfig?.unit || habit?.healthConfig?.unit || "minutes";
      const targetValue =
        habit?.targetConfig?.targetValue ||
        habit?.healthConfig?.targetValue ||
        30;

      // For time-based habits, convert seconds to minutes for current value
      const currentValue = isTimeBased ? Math.floor(timer.currentTime / 60) : timer.currentTime;
      const status = currentValue >= targetValue ? "done" : currentValue > 0 ? "partial" : "skipped";

      // Always save progress, even if it's 0 (when timer is reset)
      await dataService.markHabitProgress(habitId, today, status, {
        currentValue,
        targetValue,
        unit,
        timeSpentSeconds: isTimeBased ? timer.currentTime : undefined,
        notes: timer.currentTime === 0 ? "Timer reset" : "Manual timer adjustment",
      });
      
      console.log(`Saved progress: ${currentValue}/${targetValue} ${unit} (${status})`);
    } catch (error) {
      console.error('Failed to save manual progress:', error);
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
    } catch (error) {
      console.error('Failed to clear timer state:', error);
    }
  };

  const startTimer = async () => {
    if (!timer.isRunning) {
      // Sync current manually adjusted time with TimerService
      // const existingTimer = timerService.getTimer(habitId);
      const existingTimer = null;
      if (existingTimer) {
        // existingTimer.currentTime = timer.currentTime;
        // existingTimer.targetTime = timer.targetTime;
      }
      // await timerService.startTimer(habitId, timer.targetTime);
    }
  };

  const pauseTimer = async () => {
    if (timer.isRunning) {
      // await timerService.pauseTimer(habitId);
    }
  };

  const resetTimer = async () => {
    // Reset local state
    setTimer(prev => ({
      ...prev,
      currentTime: 0,
      isRunning: false,
      isPaused: false,
    }));

    // Reset TimerService
    // await timerService.resetTimer(habitId);
    
    // Update progress percentage
    setProgressPercentage(0);

    // Save the reset state immediately
    await saveTimerState(false);
    
    // Also save progress to database (reset to 0)
    await saveManualProgress();
  };

  const completeSession = async () => {
    try {
      // Fill timer to full target time
      setTimer(prev => ({
        ...prev,
        currentTime: prev.targetTime,
        isRunning: false,
        isPaused: false,
      }));

      // Update TimerService to reflect completion
      // const existingTimer = timerService.getTimer(habitId);
      const existingTimer = null;
      if (existingTimer) {
        // existingTimer.currentTime = timer.targetTime;
        // existingTimer.isRunning = false;
        // existingTimer.isPaused = false;
      }

      const today = new Date().toISOString().split("T")[0];
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
          // await apiService.markHabitProgress(habitId, {
          //   date: today,
          //   status,
          //   currentValue,
          //   targetValue,
          //   unit,
          // });
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
          } catch (storageError) {
            console.error('Local storage fallback also failed:', storageError);
            throw new Error('Failed to save progress anywhere - all methods failed');
          }
        }
      }

      // Pause timer (already done above, but ensure it's stopped)
      // timerService.pauseTimer(habitId);
      
      // Clear saved timer state since session is complete
      await clearTimerState();

      // Notify smart notification service about completion
      try {
        await onHabitCompleted(habitId);
      } catch (notificationError) {
        console.error('Failed to process smart notifications:', notificationError);
        // Don't fail the completion if notifications fail
      }

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
      

      // Update timer display
      const newCurrentTime = isTimeBased ? currentValue * 60 : currentValue;
      setTimer((prev) => ({
        ...prev,
        currentTime: newCurrentTime,
      }));

      // Update TimerService with the new value
      // const existingTimer = timerService.getTimer(habitId);
      const existingTimer = null;
      if (existingTimer) {
        // existingTimer.currentTime = newCurrentTime;
      }

      // Save the updated timer state immediately
      await saveTimerState(false);

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

  // Manual timer adjustment via drag
  const calculateAngleFromTouch = (x: number, y: number) => {
    const centerX = 180; // Progress circle center (360px / 2)
    const centerY = 180; // Progress circle center (360px / 2)
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    // Normalize to 0-360 and adjust to start from top (12 o'clock)
    angle = (angle + 90 + 360) % 360;
    return angle;
  };

  // Add throttling ref for smoother dragging
  const lastUpdateTime = useRef(0);
  const THROTTLE_MS = 16; // ~60fps

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Expanded touch area for better user experience
      const { locationX, locationY } = evt.nativeEvent;
      const centerX = 180; // Center of the 360px progress circle
      const centerY = 180; // Center of the 360px progress circle
      const distance = Math.sqrt(
        Math.pow(locationX - centerX, 2) + Math.pow(locationY - centerY, 2)
      );
      // Allow touches within and around the circle for easier dragging - using radius 155
      return distance <= 155 + 40 && distance >= 155 - 40;
    },

    onPanResponderGrant: () => {
      // Pause timer when user starts dragging
      if (timer.isRunning) {
        pauseTimer();
      }
    },

    onPanResponderMove: (evt, gestureState) => {
      // Throttle updates for smoother performance
      const now = Date.now();
      if (now - lastUpdateTime.current < THROTTLE_MS) {
        return;
      }
      lastUpdateTime.current = now;

      const { locationX, locationY } = evt.nativeEvent;
      const angle = calculateAngleFromTouch(locationX, locationY);
      const progress = Math.max(0, Math.min(1, angle / 360));
      
      if (isTimeBased) {
        // For countdown timer: when user drags, they're setting elapsed time
        // Progress 0 = no time elapsed (shows full target time remaining)
        // Progress 1 = all time elapsed (shows 0:00 remaining)
        const newElapsedTime = Math.round(progress * timer.targetTime);
        const clampedElapsedTime = Math.max(0, Math.min(timer.targetTime, newElapsedTime));
        setTimer(prev => ({
          ...prev,
          currentTime: clampedElapsedTime
        }));
        setProgressPercentage(Math.floor((clampedElapsedTime / timer.targetTime) * 100));
        
        // Update TimerService with the manually adjusted time
        // const existingTimer = timerService.getTimer(habitId);
      const existingTimer = null;
        if (existingTimer) {
          // existingTimer.currentTime = clampedElapsedTime;
        }
      } else {
        // For count-based habits, adjust current value
        const newValue = Math.round(progress * targetValue);
        const clampedValue = Math.max(0, Math.min(targetValue, newValue));
        setTimer(prev => ({
          ...prev,
          currentTime: clampedValue
        }));
        setProgressPercentage(Math.floor((clampedValue / targetValue) * 100));
        
        // Update TimerService with the manually adjusted value
        // const existingTimer = timerService.getTimer(habitId);
      const existingTimer = null;
        if (existingTimer) {
          // existingTimer.currentTime = clampedValue;
        }
      }
      
      // Debounced save during dragging
      saveTimerState(true);
    },

    onPanResponderRelease: async () => {
      // Save the manually adjusted time immediately
      await saveTimerState(false);
      // Also save progress to database
      await saveManualProgress();
    },
  });

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
      <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <NeumorphCard variant="medium" colorType="whiteGlass" style={styles.loadingContainer} animated={true}>
            <Text style={styles.loadingText}>Loading habit...</Text>
          </NeumorphCard>
        </SafeAreaView>
      </View>
    );
  }

  const backgroundColor = habit?.color || NeumorphismColors.habitColors.sage; // Use habit's color

  return (
    <View style={[styles.container, { backgroundColor: NeumorphismColors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        {/* Header */}
        <NeumorphCard variant="subtle" colorType="whiteGlass" style={[styles.header, { marginTop: insets.top - 45, paddingTop: 0 }]} animated={true}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{habit.title}</Text>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => {
              if (habit) {
                navigation.navigate('HabitEdit', { habit });
              }
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
          </TouchableOpacity>
        </NeumorphCard>

      {/* Main Timer Area */}
      <View style={styles.timerContainer}>
        {/* Neumorphism Timer Circle Container */}
        <View style={styles.timerWrapper}>
        <View style={styles.neumorphismCircle}>
          <View style={styles.progressCircle} {...panResponder.panHandlers}>
            {/* Progress Arc */}
            <Svg width={340} height={340} style={styles.progressArc}>
              {/* Background track circle with neumorphic inset effect - pushed to edge */}
              <Circle
                cx={170}
                cy={170}
                r={155}
                stroke="rgba(0, 0, 0, 0.1)"
                strokeWidth={16}
                fill="transparent"
                strokeLinecap="round"
              />
              {/* Inner shadow track */}
              <Circle
                cx={170}
                cy={170}
                r={155}
                stroke="rgba(255, 255, 255, 0.8)"
                strokeWidth={12}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray="2 6"
                opacity={0.6}
              />
              {/* Main progress circle with gradient effect - thicker and at edge */}
              <Circle
                cx={170}
                cy={170}
                r={155}
                stroke={backgroundColor}
                strokeWidth={14}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 155}
                strokeDashoffset={2 * Math.PI * 155 * (1 - (progressPercentage / 100))}
                transform="rotate(-90 170 170)"
                opacity={0.9}
              />
              {/* Outer highlight for neumorphic raised effect */}
              <Circle
                cx={170}
                cy={170}
                r={155}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth={4}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 155}
                strokeDashoffset={2 * Math.PI * 155 * (1 - (progressPercentage / 100))}
                transform="rotate(-90 170 170)"
                opacity={0.7}
              />
            </Svg>

            {/* Moving circular handle - positioned on the progress circle edge */}
            <View style={[
              styles.progressHandle,
              {
                transform: [
                  {
                    rotate: `${(progressPercentage / 100) * 360}deg`
                  }
                ]
              }
            ]}>
              <View style={styles.neumorphismHandle} />
            </View>

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
            </View>
          </View>
        </View>
        </View>
      </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
        {isTimeBased ? (
          // Timer Controls
          <View style={styles.timerControls}>
            <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
              <Ionicons name="refresh" size={22} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playButton}
              onPress={timer.isRunning ? pauseTimer : startTimer}
            >
              <Ionicons
                name={timer.isRunning ? "pause" : "play"}
                size={28}
                color={backgroundColor || '#A8B5A0'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowManualInput(true)}
            >
              <Ionicons name="add" size={22} color="#666" />
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
        <NeumorphCard variant="light" colorType="whiteGlass" style={styles.bottomTabBar} animated={true}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="time-outline" size={24} color="#666" />
          <Text style={styles.tabLabel}>Style</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="musical-note-outline" size={24} color="#666" />
          <Text style={styles.tabLabel}>Sound</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="timer-outline" size={24} color="#666" />
          <Text style={styles.tabLabel}>Countdown</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="document-text-outline" size={24} color="#666" />
          <Text style={styles.tabLabel}>Memo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="stats-chart-outline" size={24} color="#666" />
          <Text style={styles.tabLabel}>Stat</Text>
        </TouchableOpacity>
        </NeumorphCard>

        {/* Floating Complete Button (for timer) */}
        {isTimeBased && (
          <View style={styles.floatingCompleteContainer}>
            <NeumorphButton
              title="Complete Session"
              variant="primary"
              size="large"
              onPress={completeSession}
              glassIntensity="strong"
              style={styles.floatingCompleteButton}
            />
          </View>
        )}

        {/* Manual Input Modal */}
        <NeumorphModal
          visible={showManualInput}
          onClose={() => setShowManualInput(false)}
          title={`How many ${unit} have you completed?`}
          glassIntensity="strong"
        >
          <NeumorphInput
            value={manualValue}
            onChangeText={setManualValue}
            keyboardType="numeric"
            placeholder={`Enter ${unit}...`}
            autoFocus
            glassIntensity="subtle"
            style={styles.modalInput}
          />
          <View style={styles.modalButtons}>
            <NeumorphButton
              title="Cancel"
              variant="secondary"
              size="medium"
              onPress={() => {
                setShowManualInput(false);
                setManualValue("");
              }}
              glassIntensity="subtle"
              style={styles.cancelButton}
            />
            <NeumorphButton
              title="Add"
              variant="primary"
              size="medium"
              onPress={handleManualAdd}
              glassIntensity="medium"
              style={styles.confirmButton}
            />
          </View>
        </NeumorphModal>


        {/* Color Picker Modal */}
        <NeumorphModal
          visible={showColorPicker}
          onRequestClose={() => setShowColorPicker(false)}
          title="Choose Habit Color"
          style={styles.colorPickerModal}
        >
          <ColorPicker
            selectedColor={habit?.color || '#A8B5A0'}
            onColorSelect={handleColorChange}
          />
        </NeumorphModal>
      </SafeAreaView>
    </View>
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
    color: "#333",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    height: 64,
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
    color: '#333',
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
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  timerWrapper: {
    // Outer shadow for neumorphic effect
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderRadius: 190,
  },
  neumorphismCircle: {
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: NeumorphismColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    // Inner shadow for pressed/inset effect
    shadowColor: 'rgba(255, 255, 255, 0.9)',
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    // Subtle border for definition
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressCircle: {
    width: 360,
    height: 360,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderRadius: 180,
    backgroundColor: 'transparent',
  },
  tickMarks: {
    position: 'absolute',
  },
  progressArc: {
    position: 'absolute',
  },
  progressHandle: {
    position: "absolute",
    width: 310, // 2 * radius (155)
    height: 310, // 2 * radius (155)
    justifyContent: "flex-start",
    alignItems: "center",
    top: 25, // (360 - 310) / 2 to center within the 360px circle container
    left: 25, // (360 - 310) / 2 to center within the 360px circle container
  },
  neumorphismHandle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: NeumorphismColors.background,
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    // Enhanced neumorphic borders for better depth
    borderWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.9)',
    borderLeftColor: 'rgba(255, 255, 255, 0.9)',
    borderRightColor: 'rgba(0, 0, 0, 0.15)',
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
    // Add inner highlight
    overflow: 'hidden',
    // Position at the top edge of the container (radius distance from center)
    marginTop: -14, // Half of handle height to center it on the circle
  },
  handleButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2196F3",
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginTop: (160 - CIRCLE_RADIUS) - 10, // Position on the circle edge
  },
  svgCircle: {
    position: "absolute",
  },
  timerContent: {
    alignItems: "center",
  },
  timerText: {
    fontSize: 64,
    fontWeight: "600",
    color: "#1a1a1a",
    fontFamily: "System",
    letterSpacing: -2,
  },
  valueText: {
    fontSize: 64,
    fontWeight: "600",
    color: "#1a1a1a",
    fontFamily: "System",
    letterSpacing: -2,
  },
  unitText: {
    fontSize: theme.fontSize.lg,
    color: "#666",
    marginTop: theme.spacing.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  progressPercentageText: {
    fontSize: theme.fontSize.md,
    color: "#2196F3",
    fontWeight: theme.fontWeight.semibold,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    position: 'absolute',
    bottom: -theme.spacing.xl,
  },
  controlsContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: 100,
    backgroundColor: NeumorphismColors.background,
    borderRadius: theme.borderRadius.xl,
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.7)',
    borderLeftColor: 'rgba(255, 255, 255, 0.7)',
    borderRightColor: 'rgba(0, 0, 0, 0.05)',
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  timerControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.xxl,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: NeumorphismColors.background,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.7)',
    borderLeftColor: 'rgba(255, 255, 255, 0.7)',
    borderRightColor: 'rgba(0, 0, 0, 0.05)',
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  playButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: NeumorphismColors.background,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    borderLeftColor: 'rgba(255, 255, 255, 0.8)',
    borderRightColor: 'rgba(0, 0, 0, 0.05)',
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  manualControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.lg,
  },
  addButton: {
    flex: 1,
    backgroundColor: NeumorphismColors.background,
    borderRadius: 26,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.7)',
    borderLeftColor: 'rgba(255, 255, 255, 0.7)',
    borderRightColor: 'rgba(0, 0, 0, 0.05)',
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    marginRight: theme.spacing.md,
  },
  addButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: "#333",
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 0.5,
  },
  completeButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: NeumorphismColors.background,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.7)',
    borderLeftColor: 'rgba(255, 255, 255, 0.7)',
    borderRightColor: 'rgba(0, 0, 0, 0.05)',
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  singleCompleteButton: {
    flex: 1,
    width: "auto",
    paddingHorizontal: theme.spacing.xl,
    height: 56,
    marginRight: 0,
  },
  singleCompleteText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: "#333",
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 0.5,
  },
  floatingCompleteContainer: {
    position: "absolute",
    bottom: 240,
    left: theme.spacing.xl,
    right: theme.spacing.xl,
    zIndex: 1000,
  },
  floatingCompleteButton: {
    width: '100%',
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
    color: "#333",
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg + 30,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
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
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  colorPickerModal: {
    width: '90%',
    maxWidth: 450,
    minHeight: 400,
  },
});
