import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/index';
import { NeumorphCard } from '../neumorphism';
import { DailyStats } from '../../types';

interface ProgressChartProps {
  weeklyData: DailyStats[];
  monthlyData: DailyStats[];
  title?: string;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ 
  weeklyData, 
  monthlyData, 
  title = "Progress Trend" 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  
  const progressData = selectedPeriod === 'week' ? weeklyData : monthlyData;
  
  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      <TouchableOpacity 
        style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
        onPress={() => setSelectedPeriod('week')}
      >
        <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.periodButtonTextActive]}>
          Week
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
        onPress={() => setSelectedPeriod('month')}
      >
        <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
          Month
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.noDataContainer}>
      <Text style={styles.noDataText}>No data available yet</Text>
    </View>
  );

  return (
    <NeumorphCard variant="convex" style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
        {renderPeriodSelector()}
      </View>
      {progressData.length === 0 ? renderEmptyState() : (
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>
            Chart visualization would go here
          </Text>
          <Text style={styles.dataInfo}>
            {progressData.length} data points available
          </Text>
        </View>
      )}
    </NeumorphCard>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  chartTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  periodButtonTextActive: {
    color: theme.colors.white,
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  chartPlaceholderText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  dataInfo: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
});