import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/index';
import { NeumorphCard } from '../neumorphism';
import { HabitProgress as HabitProgressType } from '../../types';

export interface HabitProgressProps {
  progress: HabitProgressType;
  onEdit?: () => void;
  showDate?: boolean;
  compact?: boolean;
}

export const HabitProgress: React.FC<HabitProgressProps> = ({
  progress,
  onEdit,
  showDate = true,
  compact = false,
}) => {
  const getStatusInfo = () => {
    switch (progress.status) {
      case 'done':
        return {
          icon: 'checkmark-circle' as const,
          color: theme.colors.success,
          label: 'Completed',
          bgColor: `${theme.colors.success}15`,
        };
      case 'partial':
        return {
          icon: 'remove-circle' as const,
          color: theme.colors.warning,
          label: 'Partial',
          bgColor: `${theme.colors.warning}15`,
        };
      case 'skip':
        return {
          icon: 'close-circle' as const,
          color: theme.colors.error,
          label: 'Skipped',
          bgColor: `${theme.colors.error}15`,
        };
      default:
        return {
          icon: 'ellipse-outline' as const,
          color: theme.colors.textSecondary,
          label: 'Pending',
          bgColor: theme.colors.backgroundSecondary,
        };
    }
  };

  const statusInfo = getStatusInfo();
  const cardStyle = [
    styles.card,
    compact && styles.compactCard,
    { backgroundColor: statusInfo.bgColor }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <TouchableOpacity onPress={onEdit} disabled={!onEdit} activeOpacity={0.8}>
      <NeumorphCard variant="convex" style={cardStyle}>
        <View style={styles.header}>
          <View style={styles.statusContainer}>
            <Ionicons 
              name={statusInfo.icon} 
              size={compact ? 16 : 20} 
              color={statusInfo.color} 
            />
            <Text style={[styles.statusLabel, compact && styles.compactText]}>
              {statusInfo.label}
            </Text>
          </View>

          {showDate && (
            <View style={styles.dateContainer}>
              <Text style={[styles.date, compact && styles.compactText]}>
                {formatDate(progress.date)}
              </Text>
              <Text style={[styles.time, compact && styles.compactText]}>
                {formatTime(progress.updatedAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Show value progress for measurable habits */}
        {progress.currentValue !== undefined && progress.targetValue && (
          <View style={styles.valueContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min((progress.currentValue / progress.targetValue) * 100, 100)}%`,
                    backgroundColor: statusInfo.color,
                  }
                ]} 
              />
            </View>
            <Text style={[styles.valueText, compact && styles.compactText]}>
              {progress.currentValue} / {progress.targetValue} {progress.unit || ''}
            </Text>
          </View>
        )}

        {/* Show notes if available */}
        {!compact && progress.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {progress.notes}
          </Text>
        )}
      </NeumorphCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  compactCard: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  date: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  time: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  valueContainer: {
    marginTop: theme.spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 2,
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  valueText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  notes: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  compactText: {
    fontSize: theme.fontSize.xs,
  },
});