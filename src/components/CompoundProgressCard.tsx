import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { CompoundProgress } from '../services/AtomicHabitsService';

interface CompoundProgressCardProps {
  progress: CompoundProgress;
  title: string;
  onViewDetails?: () => void;
}

export const CompoundProgressCard: React.FC<CompoundProgressCardProps> = ({
  progress,
  title,
  onViewDetails,
}) => {
  const getImprovementIcon = (rate: number) => {
    if (rate >= 2) return { name: 'rocket', color: '#4CAF50' };
    if (rate >= 1) return { name: 'trending-up', color: '#2196F3' };
    if (rate >= 0.5) return { name: 'arrow-up', color: '#FF9800' };
    return { name: 'remove', color: '#9E9E9E' };
  };

  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  };

  const icon = getImprovementIcon(progress.improvementRate);
  const growthPercentage = progress.compoundedGrowth;
  const projectedGrowth = progress.projectedValue > progress.currentValue 
    ? ((progress.projectedValue - progress.currentValue) / progress.currentValue * 100)
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.daysContainer}>
            <Text style={styles.daysText}>
              {progress.daysSinceStart} days
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.iconContainer}
          onPress={onViewDetails}
        >
          <Ionicons 
            name={icon.name as any} 
            size={20} 
            color={icon.color} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.currentSection}>
          <Text style={styles.label}>Current</Text>
          <Text style={styles.currentValue}>
            {formatValue(progress.currentValue)}
          </Text>
        </View>

        <View style={styles.arrowContainer}>
          <Ionicons 
            name="arrow-forward" 
            size={16} 
            color={theme.colors.textSecondary} 
          />
        </View>

        <View style={styles.projectedSection}>
          <Text style={styles.label}>30-day projection</Text>
          <Text style={styles.projectedValue}>
            {formatValue(progress.projectedValue)}
          </Text>
        </View>
      </View>

      <View style={styles.improvementSection}>
        <View style={styles.improvementMetric}>
          <Text style={styles.metricLabel}>Daily Improvement</Text>
          <Text style={[styles.metricValue, { color: icon.color }]}>
            +{progress.improvementRate.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.improvementMetric}>
          <Text style={styles.metricLabel}>Total Growth</Text>
          <Text style={[styles.metricValue, { color: growthPercentage >= 0 ? '#4CAF50' : '#F44336' }]}>
            {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
          </Text>
        </View>
      </View>

      {progress.improvementRate >= 1 && (
        <View style={styles.insightContainer}>
          <View style={styles.insightIcon}>
            <Ionicons name="bulb" size={14} color="#FFB300" />
          </View>
          <Text style={styles.insightText}>
            Great momentum! Your {progress.improvementRate.toFixed(1)}% daily improvement compounds to amazing results.
          </Text>
        </View>
      )}

      {progress.improvementRate < 0.5 && progress.daysSinceStart >= 7 && (
        <View style={[styles.insightContainer, styles.warningContainer]}>
          <View style={styles.insightIcon}>
            <Ionicons name="warning" size={14} color="#FF6B7A" />
          </View>
          <Text style={[styles.insightText, styles.warningText]}>
            Focus on just 1% better each day. Small improvements compound over time!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
  },
  daysContainer: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  daysText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  iconContainer: {
    padding: theme.spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  currentSection: {
    flex: 1,
  },
  projectedSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  arrowContainer: {
    marginHorizontal: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    fontWeight: theme.fontWeight.medium,
  },
  currentValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  projectedValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  improvementSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSoft,
  },
  improvementMetric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    fontWeight: theme.fontWeight.medium,
  },
  metricValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  insightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: '#FFF8E1',
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB300',
  },
  warningContainer: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#FF6B7A',
  },
  insightIcon: {
    marginRight: theme.spacing.sm,
  },
  insightText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: '#F57F17',
    fontWeight: theme.fontWeight.medium,
  },
  warningText: {
    color: '#C62828',
  },
});