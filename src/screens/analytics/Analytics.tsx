import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/index';
import { OverviewCards, ProgressChart, TopHabits, OverviewCardData } from '../../components/analytics';
import { useAnalytics } from '../../hooks/useAnalytics';

const Analytics = () => {
  const navigation = useNavigation();
  const { analyticsData, loading, refreshing, error, refresh } = useAnalytics();

  const getOverviewCards = (): OverviewCardData[] => {
    if (!analyticsData) return [];

    return [
      {
        value: analyticsData.activeHabits,
        label: 'Active Habits',
        icon: 'checkmark-circle',
        color: theme.colors.success,
      },
      {
        value: analyticsData.totalStreaks,
        label: 'Total Streaks',
        icon: 'flame',
        color: theme.colors.warning,
      },
      {
        value: `${Math.round(analyticsData.averageCompletionRate)}%`,
        label: 'Completion Rate',
        icon: 'trending-up',
        color: theme.colors.primary,
      },
      {
        value: analyticsData.totalHabits,
        label: 'Total Habits',
        icon: 'list',
        color: theme.colors.secondary,
      },
    ];
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        {analyticsData && <OverviewCards cards={getOverviewCards()} />}
        {analyticsData && (
          <ProgressChart 
            weeklyData={analyticsData.weeklyProgress}
            monthlyData={analyticsData.monthlyProgress}
          />
        )}
        {analyticsData && <TopHabits habits={analyticsData.habitStats} />}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.error || theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default Analytics;