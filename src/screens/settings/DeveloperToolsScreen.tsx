import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockDataService } from '../../services/core';
import { theme } from '../../theme';
import { NeumorphCard, NeumorphButton, NeumorphismColors } from '../../components/neumorphism';
import { RootStackScreenProps } from '../../types/navigation';

type DeveloperToolsScreenProps = RootStackScreenProps<'DeveloperTools'>;

export const DeveloperToolsScreen: React.FC<DeveloperToolsScreenProps> = ({
  navigation,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [mockDataStats, setMockDataStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMockDataStats();
  }, []);

  const loadMockDataStats = async () => {
    try {
      const stats = await mockDataService.getMockDataStats();
      setMockDataStats(stats);
    } catch (error) {
      console.error('Error loading mock data stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMockDataStats();
    setRefreshing(false);
  };

  const handleCreateMockData = () => {
    Alert.alert(
      'Create Mock Data',
      'This will create 3 test users with 1-2 years of realistic habit data. This is for testing purposes only.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          style: 'default',
          onPress: async () => {
            setIsLoading(true);
            try {
              await mockDataService.createMockData();
              await loadMockDataStats();
              Alert.alert('Success', 'Mock data created successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to create mock data');
              console.error(error);
            }
            setIsLoading(false);
          },
        },
      ]
    );
  };

  const handleRemoveMockData = () => {
    Alert.alert(
      'Remove Mock Data',
      'This will permanently delete all test users and their data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await mockDataService.removeMockData();
              await loadMockDataStats();
              Alert.alert('Success', 'Mock data removed successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove mock data');
              console.error(error);
            }
            setIsLoading(false);
          },
        },
      ]
    );
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <NeumorphButton
          variant="secondary"
          size="small"
          onPress={handleGoBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
        </NeumorphButton>
        <Text style={styles.title}>Developer Tools</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <NeumorphCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="server" size={24} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Mock Data Management</Text>
          </View>
          <Text style={styles.cardDescription}>
            Create and manage test data for development and testing purposes.
          </Text>

          {mockDataStats && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Current Mock Data:</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{mockDataStats.users}</Text>
                  <Text style={styles.statLabel}>Users</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{mockDataStats.habits}</Text>
                  <Text style={styles.statLabel}>Habits</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{mockDataStats.progress}</Text>
                  <Text style={styles.statLabel}>Progress Records</Text>
                </View>
              </View>
              {mockDataStats.users > 0 && (
                <Text style={styles.dateRange}>
                  Data range: {mockDataStats.dateRange.start} to {mockDataStats.dateRange.end}
                </Text>
              )}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <NeumorphButton
              title="Create Mock Data"
              variant="primary"
              onPress={handleCreateMockData}
              disabled={isLoading}
              style={styles.button}
            />
            <NeumorphButton
              title="Remove Mock Data"
              variant="secondary"
              onPress={handleRemoveMockData}
              disabled={isLoading || (mockDataStats && mockDataStats.users === 0)}
              style={styles.button}
            />
          </View>
        </NeumorphCard>

        <NeumorphCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="warning" size={24} color="#FF6B6B" />
            <Text style={styles.cardTitle}>Important Notice</Text>
          </View>
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Mock data is for testing purposes only
            </Text>
            <Text style={styles.warningText}>
              🗑️ Remember to remove all mock data before production
            </Text>
            <Text style={styles.warningText}>
              🔄 Mock data includes offline storage for full testing
            </Text>
          </View>
        </NeumorphCard>

        <NeumorphCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Mock Data Details</Text>
          </View>
          <Text style={styles.detailsText}>
            • Creates 3 test users with different profiles{'\n'}
            • Each user has 8-15 different habits{'\n'}
            • Generates 1-2 years of realistic progress data{'\n'}
            • Includes various habit types: time, boolean, number{'\n'}
            • Different completion rates per habit category{'\n'}
            • Seasonal patterns and weekend variations{'\n'}
            • Stored both in Supabase and offline storage
          </Text>
        </NeumorphCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NeumorphismColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: NeumorphismColors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  dateRange: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    marginBottom: 0,
  },
  warningContainer: {
    gap: 8,
  },
  warningText: {
    fontSize: theme.fontSize.sm,
    color: '#FF6B6B',
    fontWeight: theme.fontWeight.medium,
  },
  detailsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

export default DeveloperToolsScreen;