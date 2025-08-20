import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HabitWithStats } from '../types';
import { MainTabScreenProps } from '../types/navigation';
import { theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/ApiService';
import { useAuth } from '../contexts/AuthContext';

type CalendarScreenProps = MainTabScreenProps<'Calendar'>;

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasProgress: boolean;
  completionRate?: number;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('Overall');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [userStats, setUserStats] = useState<any>(null);
  const [dailyProgress, setDailyProgress] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    loadHabits();
    loadStats();
    loadDailyProgress();
  }, [currentMonth]);

  const loadStats = async () => {
    try {
      const stats = null; // Simplified for now
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setUserStats(null);
    }
  };

  const loadDailyProgress = async () => {
    try {
      const progressMap = new Map<string, number>();
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Load progress for each day of the current month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = new Date(year, month, day).toISOString().split('T')[0];
        try {
          // Simplified day stats for now - set to 0 completion rate
          progressMap.set(dateStr, 0);
        } catch (error) {
          // If day stats not available, set to 0
          progressMap.set(dateStr, 0);
        }
      }
      
      setDailyProgress(progressMap);
    } catch (error) {
      console.error('Failed to load daily progress:', error);
      setDailyProgress(new Map());
    }
  };

  const loadHabits = async () => {
    try {
      // Load habits data
      let habitsData: any[] = [];
      
      if (isAuthenticated) {
        habitsData = await apiService.getHabits();
      } else {
        const localHabitsStr = await AsyncStorage.getItem('local_habits');
        habitsData = localHabitsStr ? JSON.parse(localHabitsStr) : [];
      }
      
      const habitsWithStats = habitsData.map((habit: any) => ({
        ...habit,
        todayProgress: 0,
        completionRate: 0,
        currentValue: 0
      }));
      setHabits(habitsWithStats);
    } catch (error) {
      console.error('Failed to load habits:', error);
      setHabits([]); // Set empty array on error
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        isToday: false,
        hasProgress: false,
      });
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isToday = new Date().toDateString() === currentDate.toDateString();
      const dateStr = currentDate.toISOString().split('T')[0];
      const completionRate = dailyProgress.get(dateStr) || 0;
      const hasProgress = completionRate > 0;
      
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday,
        hasProgress,
        completionRate,
      });
    }
    
    // Add next month's leading days to fill the grid
    const totalCells = Math.ceil(days.length / 7) * 7;
    for (let day = 1; days.length < totalCells; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: false,
        hasProgress: false,
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <TouchableOpacity onPress={() => navigateMonth('prev')}>
        <Ionicons name="chevron-back" size={theme.fontSize.xl} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={styles.monthYear}>
        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </Text>
      <TouchableOpacity onPress={() => navigateMonth('next')}>
        <Ionicons name="chevron-forward" size={theme.fontSize.xl} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );
  
  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    return (
      <View style={styles.calendarContainer}>
        {/* Week day headers */}
        <View style={styles.weekDaysRow}>
          {weekDays.map((day, index) => (
            <Text key={index} style={styles.weekDayLabel}>{day}</Text>
          ))}
        </View>
        
        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {days.map((dayData, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.calendarDay,
                dayData.isToday && styles.todayDay,
                dayData.hasProgress && styles.progressDay,
              ]}
            >
              <Text style={[
                styles.calendarDayText,
                !dayData.isCurrentMonth && styles.otherMonthText,
                dayData.isToday && styles.todayText,
              ]}>
                {dayData.date}
              </Text>
              {dayData.hasProgress && dayData.isCurrentMonth && (
                <View style={[
                  styles.progressDot,
                  { opacity: Math.max(0.3, (dayData.completionRate || 0) / 100) }
                ]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  

  const renderStatsSection = () => (
    <View style={styles.statsSection}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userStats?.completionRate || 0}%</Text>
          <Text style={styles.statLabel}>completion</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userStats?.longestStreak || 0}</Text>
          <Text style={styles.statLabel}>best streak</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userStats?.perfectDays || 0}</Text>
          <Text style={styles.statLabel}>perfect days</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <Text style={styles.headerSubtitle}>Track your habit progress</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderStatsSection()}
        {renderCalendarHeader()}
        {renderCalendar()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.normal,
    color: theme.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.xl,
  },
  monthYear: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  calendarContainer: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
  },
  weekDayLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    height: theme.spacing.xxl - theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 1,
  },
  todayDay: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.xs,
  },
  progressDay: {
    borderRadius: theme.borderRadius.xs,
  },
  calendarDayText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.normal,
  },
  otherMonthText: {
    color: theme.colors.textDisabled,
  },
  todayText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  progressDot: {
    position: 'absolute',
    bottom: theme.spacing.xs / 2,
    width: theme.spacing.xs - 1,
    height: theme.spacing.xs - 1,
    borderRadius: (theme.spacing.xs - 1) / 2,
    backgroundColor: theme.colors.primary,
  },
  statsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statNumber: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.light,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    fontWeight: theme.fontWeight.medium,
  },
});