import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HabitProgressStatus } from '../types';

interface CalendarDay {
  date: string;
  status?: HabitProgressStatus;
  isToday: boolean;
  isCurrentMonth: boolean;
}

interface CalendarHeatmapProps {
  year: number;
  month: number;
  progressData: Array<{ date: string; status: HabitProgressStatus }>;
  onDatePress?: (date: string) => void;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  year,
  month,
  progressData,
  onDatePress,
}) => {
  const getDaysInMonth = (year: number, month: number): CalendarDay[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    const days: CalendarDay[] = [];

    // Add empty cells for days before the first day of the month
    const startDayOfWeek = firstDay.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      const date = new Date(year, month, 1 - startDayOfWeek + i);
      days.push({
        date: date.toISOString().split('T')[0],
        isToday: false,
        isCurrentMonth: false,
      });
    }

    // Add days of the current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const progressItem = progressData.find(p => p.date === dateString);

      days.push({
        date: dateString,
        status: progressItem?.status,
        isToday: dateString === todayString,
        isCurrentMonth: true,
      });
    }

    // Add empty cells for remaining days to complete the grid (ensure multiple of 7)
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remainingCells = totalCells - days.length;
    
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date: date.toISOString().split('T')[0],
        isToday: false,
        isCurrentMonth: false,
      });
    }

    console.log(`Calendar for ${year}-${month + 1}: Generated ${days.length} days`);
    console.log('First week:', days.slice(0, 7).map(d => new Date(d.date).getDate()));
    
    return days;
  };

  const getDayStyle = (day: CalendarDay) => {
    const baseStyle = [styles.dayCell];

    if (!day.isCurrentMonth) {
      baseStyle.push(styles.otherMonth);
    }

    if (day.isToday) {
      baseStyle.push(styles.today);
    }

    if (day.status === 'done') {
      baseStyle.push(styles.completed);
    } else if (day.status === 'skip') {
      baseStyle.push(styles.skipped);
    }

    return baseStyle;
  };

  const getDayTextStyle = (day: CalendarDay) => {
    const baseStyle = [styles.dayText];

    if (!day.isCurrentMonth) {
      baseStyle.push(styles.otherMonthText);
    }

    if (day.isToday) {
      baseStyle.push(styles.todayText);
    }

    if (day.status === 'done') {
      baseStyle.push(styles.completedText);
    } else if (day.status === 'skip') {
      baseStyle.push(styles.skippedText);
    }

    return baseStyle;
  };

  const handleDayPress = (day: CalendarDay) => {
    if (day.isCurrentMonth && onDatePress) {
      onDatePress(day.date);
    }
  };

  const days = getDaysInMonth(year, month);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Week day headers */}
      <View style={styles.weekDaysRow}>
        {weekDays.map((day) => (
          <Text key={day} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendar}>
        {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
              <TouchableOpacity
                key={`${day.date}-${weekIndex}-${dayIndex}`}
                style={getDayStyle(day)}
                onPress={() => handleDayPress(day)}
                disabled={!day.isCurrentMonth}
              >
                <Text style={getDayTextStyle(day)}>
                  {new Date(day.date).getDate()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.completed]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.skipped]} />
          <Text style={styles.legendText}>Skipped</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.pending]} />
          <Text style={styles.legendText}>Pending</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    paddingVertical: 8,
  },
  calendar: {
    flexDirection: 'column',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  otherMonth: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    opacity: 0.3,
  },
  otherMonthText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ccc',
  },
  today: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  todayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2196F3',
  },
  completed: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  completedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  skipped: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#FF9800',
  },
  skippedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  pending: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});