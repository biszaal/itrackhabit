import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { NeumorphCard } from './neumorphism/NeumorphCard';
import { CompoundProgress } from '../services/habits';

const { width } = Dimensions.get('window');

interface CompoundProgressCardProps {
  progress: CompoundProgress;
  title: string;
  onViewDetails: () => void;
}

export const CompoundProgressCard: React.FC<CompoundProgressCardProps> = ({
  progress,
  title,
  onViewDetails,
}) => {
  const getImprovementColor = (rate: number) => {
    if (rate >= 0.02) return '#10B981'; // Green for great improvement (2%+)
    if (rate >= 0.01) return '#F59E0B'; // Amber for good improvement (1-2%)
    if (rate >= 0) return '#6B7280'; // Gray for minimal improvement
    return '#EF4444'; // Red for decline
  };

  const getImprovementIcon = (rate: number) => {
    if (rate >= 0.01) return 'trending-up';
    if (rate >= 0) return 'remove';
    return 'trending-down';
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatValue = (value: number) => {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  const formatProjectionDays = () => {
    // Show projection for 30 days ahead
    return 30;
  };

  const improvementColor = getImprovementColor(progress.improvementRate);
  const improvementIcon = getImprovementIcon(progress.improvementRate);
  const projectionDays = formatProjectionDays();
  
  // Calculate future projection
  const futureProjection = progress.currentValue * Math.pow(1 + progress.improvementRate, projectionDays);

  return (
    <NeumorphCard style={styles.card} onPress={onViewDetails}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.subtitle}>
            {progress.daysSinceStart} day{progress.daysSinceStart !== 1 ? 's' : ''} of progress
          </Text>
        </View>
        
        <View style={[styles.improvementBadge, { backgroundColor: `${improvementColor}15` }]}>
          <Ionicons name={improvementIcon as any} size={16} color={improvementColor} />
          <Text style={[styles.improvementText, { color: improvementColor }]}>
            {formatPercentage(progress.improvementRate)}
          </Text>
        </View>
      </View>

      {/* Progress Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Started</Text>
          <Text style={styles.statValue}>{formatValue(progress.baselineValue)}</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Current</Text>
          <Text style={styles.statValue}>{formatValue(progress.currentValue)}</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Growth</Text>
          <Text style={[styles.statValue, { color: improvementColor }]}>
            {formatPercentage(progress.compoundedGrowth)}
          </Text>
        </View>
      </View>

      {/* Compound Growth Visualization */}
      <View style={styles.growthContainer}>
        <Text style={styles.growthLabel}>Compound Growth Trajectory</Text>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={styles.progressTrack} />
            <LinearGradient
              colors={[improvementColor, `${improvementColor}80`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(Math.max((progress.compoundedGrowth * 100), 2), 100)}%`,
                }
              ]}
            />
          </View>
        </View>
        
        <View style={styles.growthLabels}>
          <Text style={styles.growthStartLabel}>Start</Text>
          <Text style={[styles.growthEndLabel, { color: improvementColor }]}>
            +{formatPercentage(progress.compoundedGrowth)}
          </Text>
        </View>
      </View>

      {/* Future Projection */}
      <View style={styles.projectionContainer}>
        <View style={styles.projectionHeader}>
          <Ionicons name="telescope-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.projectionLabel}>30-Day Projection</Text>
        </View>
        
        <View style={styles.projectionContent}>
          <Text style={styles.projectionValue}>
            {formatValue(futureProjection)}
          </Text>
          <Text style={styles.projectionGrowth}>
            +{formatPercentage((futureProjection - progress.currentValue) / progress.currentValue)}
          </Text>
        </View>
        
        <Text style={styles.projectionNote}>
          If you maintain current improvement rate
        </Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity style={styles.detailsButton} onPress={onViewDetails}>
        <Text style={styles.detailsButtonText}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
      </TouchableOpacity>
    </NeumorphCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  titleContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  improvementText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: theme.fontWeight.medium,
  },
  statValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.borderSoft,
    marginHorizontal: theme.spacing.sm,
  },
  growthContainer: {
    marginBottom: theme.spacing.lg,
  },
  growthLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  progressBarContainer: {
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    position: 'relative',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.borderSoft,
    borderRadius: 4,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 4,
    minWidth: 2,
  },
  growthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  growthStartLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  growthEndLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  projectionContainer: {
    backgroundColor: `${theme.colors.primary}08`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}20`,
  },
  projectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: 6,
  },
  projectionLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  projectionContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
    gap: theme.spacing.sm,
  },
  projectionValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  projectionGrowth: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  projectionNote: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: `${theme.colors.primary}15`,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
    gap: 6,
  },
  detailsButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
});