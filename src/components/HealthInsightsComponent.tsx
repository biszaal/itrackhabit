import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { autoProgressTracker } from '../services/AutoProgressTracker';
import { healthService } from '../services/HealthService';
import { healthSyncService } from '../services/HealthSyncService';
import { HealthDataType, HealthTrend, DailyHealthSummary } from '../types/health';
import { HealthMetricType } from '../types';

const { width: screenWidth } = Dimensions.get('window');

interface HealthInsightsComponentProps {
  habitId?: string;
  metricType?: HealthMetricType;
  showFullDashboard?: boolean;
}

interface HealthInsight {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
  icon: string;
  subtitle: string;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
  }>;
}

export const HealthInsightsComponent: React.FC<HealthInsightsComponentProps> = ({
  habitId,
  metricType,
  showFullDashboard = false,
}) => {
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [healthSummary, setHealthSummary] = useState<DailyHealthSummary | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    loadHealthInsights();
    loadSyncStatus();
  }, [habitId, metricType, selectedPeriod]);

  const loadHealthInsights = async () => {
    setLoading(true);
    try {
      const insightsData: HealthInsight[] = [];

      // Check if health service is available first
      let healthServiceAvailable = false;
      try {
        const status = await healthService.initialize();
        healthServiceAvailable = status.isAvailable && status.isAuthorized;
      } catch (error) {
        console.log('Health service not available:', error instanceof Error ? error.message : String(error));
        healthServiceAvailable = false;
      }

      if (habitId) {
        // Get insights for specific habit
        try {
          const habitInsights = await autoProgressTracker.getHealthInsights(
            habitId,
            selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90
          );

          if (habitInsights) {
            const config = autoProgressTracker.getHabitConfig(habitId);
            if (config) {
              insightsData.push({
                title: `Average ${config.metricType.replace('_', ' ')}`,
                value: `${habitInsights.average} ${config.unit}`,
                trend: habitInsights.trend === 'improving' ? 'up' : 
                       habitInsights.trend === 'declining' ? 'down' : 'stable',
                color: getTrendColor(habitInsights.trend),
                icon: getMetricIcon(config.metricType),
                subtitle: `${habitInsights.trend === 'improving' ? 'Improving' : 
                          habitInsights.trend === 'declining' ? 'Declining' : 'Stable'} trend`,
              });

              insightsData.push({
                title: 'Best Day',
                value: `${habitInsights.bestDay.value} ${config.unit}`,
                trend: 'up',
                color: '#4CAF50',
                icon: 'trophy',
                subtitle: formatDate(habitInsights.bestDay.date),
              });
            }
          }
        } catch (error) {
          console.log('Failed to load habit insights:', error instanceof Error ? error.message : String(error));
        }
      }

      if (showFullDashboard) {
        // Show health habit status instead of actual health data
        try {
          const healthHabits: any[] = []; // TODO: Load health habits from dataService
          
          insightsData.push({
            title: 'Auto-Tracked Habits',
            value: healthServiceAvailable ? `${syncStatus?.registeredHabits || 0}` : '0',
            trend: 'stable',
            color: '#2196F3',
            icon: 'fitness',
            subtitle: healthServiceAvailable ? 'Active health habits' : 'Connect health to enable auto-tracking',
          });
        } catch (error) {
          console.log('Failed to load health habit status:', error instanceof Error ? error.message : String(error));
        }
      }

      setInsights(insightsData);
      
      // Load chart data
      if ((habitId || metricType) && healthServiceAvailable) {
        await loadChartData();
      }

    } catch (error) {
      console.error('Failed to load health insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
      let dataType: HealthDataType;

      if (habitId) {
        const config = autoProgressTracker.getHabitConfig(habitId);
        if (!config) return;
        dataType = mapMetricTypeToHealthDataType(config.metricType);
      } else if (metricType) {
        dataType = mapMetricTypeToHealthDataType(metricType);
      } else {
        return;
      }

      const trends = await healthService.getHealthTrends(dataType, days);
      
      if (trends.length > 0) {
        const labels = trends.map(t => formatChartDate(t.date)).slice(-7); // Show last 7 days
        const data = trends.map(t => t.value).slice(-7);

        setChartData({
          labels,
          datasets: [{
            data,
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          }],
        });
      }
    } catch (error) {
      console.error('Failed to load chart data:', error);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const status = await healthSyncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.log('Failed to load sync status:', error instanceof Error ? error.message : String(error));
      // Set default sync status when health integration is not available
      setSyncStatus({
        lastSyncTime: null,
        registeredHabits: 0,
        healthIntegrationAvailable: false,
        nextSyncIn: 0,
      });
    }
  };

  const handleForceSync = async () => {
    try {
      setLoading(true);
      await healthSyncService.syncHealthData();
      await loadHealthInsights();
      await loadSyncStatus();
    } catch (error) {
      console.error('Force sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapMetricTypeToHealthDataType = (metric: HealthMetricType): HealthDataType => {
    const mapping: Record<HealthMetricType, HealthDataType> = {
      steps: HealthDataType.STEPS,
      exercise_minutes: HealthDataType.EXERCISE_TIME,
      calories_burned: HealthDataType.CALORIES_BURNED,
      sleep_hours: HealthDataType.SLEEP_DURATION,
      workout_count: HealthDataType.WORKOUT,
    };
    return mapping[metric];
  };

  const getTrendColor = (trend: 'improving' | 'declining' | 'stable'): string => {
    switch (trend) {
      case 'improving': return '#4CAF50';
      case 'declining': return '#F44336';
      default: return '#FF9800';
    }
  };

  const getMetricIcon = (metric: HealthMetricType): string => {
    const icons: Record<HealthMetricType, string> = {
      steps: 'walk',
      exercise_minutes: 'fitness',
      calories_burned: 'flame',
      sleep_hours: 'moon',
      workout_count: 'barbell',
    };
    return icons[metric];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatChartDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  };

  const renderInsightCard = (insight: HealthInsight, index: number) => (
    <View key={index} style={styles.insightCard}>
      <View style={[styles.insightIcon, { backgroundColor: insight.color }]}>
        <Ionicons name={insight.icon as any} size={20} color="#fff" />
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightValue}>{insight.value}</Text>
        <Text style={styles.insightSubtitle}>{insight.subtitle}</Text>
      </View>
      <View style={styles.trendIndicator}>
        <Ionicons 
          name={insight.trend === 'up' ? 'trending-up' : 
                insight.trend === 'down' ? 'trending-down' : 'remove'} 
          size={16} 
          color={insight.color} 
        />
      </View>
    </View>
  );

  const renderChart = () => {
    if (!chartData) return null;

    return (
      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>7-Day Trend</Text>
          <View style={styles.periodSelector}>
            {(['7d', '30d', '90d'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive,
                  ]}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.placeholderChart}>
          <Text style={styles.placeholderText}>Chart temporarily unavailable</Text>
          <Text style={styles.placeholderSubtext}>
            Latest: {chartData.datasets[0]?.data[chartData.datasets[0].data.length - 1] || 0} | 
            Avg: {Math.round((chartData.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0) / (chartData.datasets[0]?.data.length || 1))}
          </Text>
        </View>
      </View>
    );
  };

  const renderSyncStatus = () => {
    if (!syncStatus || !showFullDashboard) return null;

    return (
      <View style={styles.syncSection}>
        <View style={styles.syncHeader}>
          <Ionicons name="sync" size={20} color="#666" />
          <Text style={styles.syncTitle}>Health Data Sync</Text>
          <TouchableOpacity onPress={handleForceSync} disabled={loading}>
            <Text style={styles.syncButton}>Sync Now</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.syncStats}>
          <View style={styles.syncStat}>
            <Text style={styles.syncStatValue}>{syncStatus.registeredHabits}</Text>
            <Text style={styles.syncStatLabel}>Health Habits</Text>
          </View>
          <View style={styles.syncStat}>
            <Text style={styles.syncStatValue}>
              {syncStatus.lastSyncTime ? formatDate(syncStatus.lastSyncTime) : 'Never'}
            </Text>
            <Text style={styles.syncStatLabel}>Last Sync</Text>
          </View>
          <View style={styles.syncStat}>
            <Text style={styles.syncStatValue}>
              {syncStatus.healthIntegrationAvailable ? 'Connected' : 'Disconnected'}
            </Text>
            <Text style={styles.syncStatLabel}>Status</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && insights.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading health insights...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {insights.length > 0 && (
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Health Insights</Text>
          {insights.map(renderInsightCard)}
        </View>
      )}

      {renderChart()}
      {renderSyncStatus()}

      {showFullDashboard && (
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Health Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color="#FF9800" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Stay Consistent</Text>
              <Text style={styles.tipText}>
                Small daily improvements in health habits lead to significant long-term benefits.
              </Text>
            </View>
          </View>
          
          <View style={styles.tipCard}>
            <Ionicons name="water" size={20} color="#2196F3" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Stay Hydrated</Text>
              <Text style={styles.tipText}>
                Proper hydration supports better sleep, exercise performance, and overall health.
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  insightsSection: {
    marginBottom: 24,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  insightSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  trendIndicator: {
    marginLeft: 8,
  },
  chartSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  periodButtonActive: {
    backgroundColor: '#2196F3',
  },
  periodButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  chart: {
    borderRadius: 8,
  },
  placeholderChart: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
  },
  syncSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  syncButton: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  syncStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  syncStat: {
    alignItems: 'center',
  },
  syncStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  syncStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});