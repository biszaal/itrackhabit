import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

export interface GlobalTimerState {
  habitId: string;
  currentTime: number;
  targetTime: number;
  isRunning: boolean;
  isPaused: boolean;
  startTime: number;
  backgroundStartTime?: number;
}

class TimerService {
  private timers: Map<string, GlobalTimerState> = new Map();
  private interval: NodeJS.Timeout | null = null;
  private listeners: Map<string, ((state: GlobalTimerState) => void)[]> = new Map();
  private completionListeners: Map<string, ((habitId: string, timer: GlobalTimerState) => void)[]> = new Map();
  private appState = AppState.currentState;
  private backgroundTime: number | null = null;

  constructor() {
    this.setupAppStateListener();
    this.loadPersistedTimers();
  }

  private setupAppStateListener() {
    AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  private handleAppStateChange(nextAppState: AppStateStatus) {
    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      // App returned to foreground
      if (this.backgroundTime) {
        const backgroundDuration = Math.floor((Date.now() - this.backgroundTime) / 1000);
        console.log(`TimerService: App returned from background. Adding ${backgroundDuration} seconds to all running timers.`);
        
        // Add background time to all running timers
        this.timers.forEach((timer, habitId) => {
          if (timer.isRunning) {
            timer.currentTime += backgroundDuration;
            this.saveTimerState(habitId);
            this.notifyListeners(habitId);
          }
        });
        
        this.backgroundTime = null;
      }
    } else if (nextAppState.match(/inactive|background/)) {
      // App going to background
      const hasRunningTimers = Array.from(this.timers.values()).some(timer => timer.isRunning);
      if (hasRunningTimers) {
        this.backgroundTime = Date.now();
        console.log('TimerService: App going to background. Timers continue running.');
        this.saveAllTimerStates();
      }
    }
    
    this.appState = nextAppState;
  }

  private async loadPersistedTimers() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const timerKeys = keys.filter(key => key.startsWith('timer_state_'));
      
      for (const key of timerKeys) {
        const habitId = key.replace('timer_state_', '');
        const savedStateStr = await AsyncStorage.getItem(key);
        
        if (savedStateStr) {
          const savedState = JSON.parse(savedStateStr);
          const lastSavedDate = new Date(savedState.lastSaved);
          const today = new Date();
          
          // Only load timers from today
          if (lastSavedDate.toDateString() === today.toDateString()) {
            let currentTime = savedState.currentTime || 0;
            
            // Check if timer was running in background
            if (savedState.isRunning && savedState.backgroundStartTime) {
              const backgroundDuration = Math.floor((Date.now() - savedState.backgroundStartTime) / 1000);
              currentTime += backgroundDuration;
              console.log(`TimerService: Restored timer for habit ${habitId} with ${backgroundDuration} seconds of background time`);
            }
            
            const timerState: GlobalTimerState = {
              habitId,
              currentTime,
              targetTime: savedState.targetTime || 1800,
              isRunning: savedState.isRunning || false,
              isPaused: savedState.isPaused || false,
              startTime: Date.now() - (currentTime * 1000),
            };
            
            this.timers.set(habitId, timerState);
            
            // Start the timer if it was running
            if (savedState.isRunning) {
              this.startGlobalInterval();
            }
          }
        }
      }
    } catch (error) {
      console.error('TimerService: Failed to load persisted timers:', error);
    }
  }

  private startGlobalInterval() {
    if (this.interval) return; // Already running
    
    this.interval = setInterval(() => {
      let hasRunningTimers = false;
      
      this.timers.forEach((timer, habitId) => {
        if (timer.isRunning) {
          timer.currentTime += 1;
          hasRunningTimers = true;
          
          // Check if timer has reached target time
          if (timer.currentTime >= timer.targetTime) {
            timer.isRunning = false;
            timer.isPaused = false;
            // Notify about timer completion
            this.notifyTimerCompletion(habitId, timer);
          }
          
          this.notifyListeners(habitId);
        }
      });
      
      // Stop interval if no timers are running
      if (!hasRunningTimers) {
        this.stopGlobalInterval();
      }
    }, 1000);
  }

  private stopGlobalInterval() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private notifyListeners(habitId: string) {
    const listeners = this.listeners.get(habitId) || [];
    const timer = this.timers.get(habitId);
    if (timer) {
      listeners.forEach(listener => listener(timer));
    }
  }

  private async saveTimerState(habitId: string) {
    try {
      const timer = this.timers.get(habitId);
      if (!timer) return;
      
      const timerKey = `timer_state_${habitId}`;
      const timerStateToSave = {
        currentTime: timer.currentTime,
        targetTime: timer.targetTime,
        isRunning: timer.isRunning,
        isPaused: timer.isPaused,
        backgroundStartTime: timer.isRunning ? Date.now() : undefined,
        lastSaved: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(timerKey, JSON.stringify(timerStateToSave));
      console.log(`TimerService: Timer state saved for habit ${habitId}:`, timerStateToSave);
    } catch (error) {
      console.error(`TimerService: Failed to save timer state for habit ${habitId}:`, error);
    }
  }

  private async saveAllTimerStates() {
    const promises = Array.from(this.timers.keys()).map(habitId => this.saveTimerState(habitId));
    await Promise.all(promises);
  }

  // Public methods
  public async startTimer(habitId: string, targetTime: number = 1800) {
    let timer = this.timers.get(habitId);
    
    if (!timer) {
      timer = {
        habitId,
        currentTime: 0,
        targetTime,
        isRunning: false,
        isPaused: false,
        startTime: Date.now(),
      };
      this.timers.set(habitId, timer);
    }
    
    if (!timer.isRunning) {
      timer.isRunning = true;
      timer.isPaused = false;
      timer.startTime = Date.now() - (timer.currentTime * 1000);
      
      this.startGlobalInterval();
      this.saveTimerState(habitId);
      this.notifyListeners(habitId);
      
      console.log(`TimerService: Started timer for habit ${habitId}`);
    }
  }

  public async pauseTimer(habitId: string) {
    const timer = this.timers.get(habitId);
    if (timer && timer.isRunning) {
      timer.isRunning = false;
      timer.isPaused = true;
      
      this.saveTimerState(habitId);
      this.notifyListeners(habitId);
      
      
      console.log(`TimerService: Paused timer for habit ${habitId}`);
    }
  }

  public async resetTimer(habitId: string) {
    const timer = this.timers.get(habitId);
    if (timer) {
      timer.currentTime = 0;
      timer.isRunning = false;
      timer.isPaused = false;
      timer.startTime = Date.now();
      
      this.saveTimerState(habitId);
      this.notifyListeners(habitId);
      
      // Clear saved state
      AsyncStorage.removeItem(`timer_state_${habitId}`);
      
      console.log(`TimerService: Reset timer for habit ${habitId}`);
    }
  }

  public getTimer(habitId: string): GlobalTimerState | undefined {
    return this.timers.get(habitId);
  }

  public addListener(habitId: string, listener: (state: GlobalTimerState) => void) {
    if (!this.listeners.has(habitId)) {
      this.listeners.set(habitId, []);
    }
    this.listeners.get(habitId)!.push(listener);
  }

  public removeListener(habitId: string, listener: (state: GlobalTimerState) => void) {
    const listeners = this.listeners.get(habitId) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  // Timer completion methods
  public addCompletionListener(habitId: string, listener: (habitId: string, timer: GlobalTimerState) => void) {
    if (!this.completionListeners.has(habitId)) {
      this.completionListeners.set(habitId, []);
    }
    this.completionListeners.get(habitId)!.push(listener);
  }

  public removeCompletionListener(habitId: string, listener: (habitId: string, timer: GlobalTimerState) => void) {
    const listeners = this.completionListeners.get(habitId) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  private notifyTimerCompletion(habitId: string, timer: GlobalTimerState) {
    const listeners = this.completionListeners.get(habitId) || [];
    listeners.forEach(listener => {
      try {
        listener(habitId, timer);
      } catch (error) {
        console.error('Error in timer completion listener:', error);
      }
    });
  }

  public clearTimer(habitId: string) {
    this.timers.delete(habitId);
    this.listeners.delete(habitId);
    this.completionListeners.delete(habitId);
    AsyncStorage.removeItem(`timer_state_${habitId}`);
  }
}

// Create singleton instance
export const timerService = new TimerService();