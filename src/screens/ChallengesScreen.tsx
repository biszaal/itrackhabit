import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components';
import { ChallengeWithStats, Challenge, ChallengeType } from '../types';
import { MainTabScreenProps } from '../types/navigation';
import { theme } from '../theme';
import { apiService } from '../services/ApiService';

type ChallengesScreenProps = MainTabScreenProps<'Challenges'>;

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([]);
  const [selectedTab, setSelectedTab] = useState<'active' | 'available'>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const [active, available] = await Promise.all([
        apiService.getActiveChallenges(),
        apiService.getAvailableChallenges(),
      ]);
      
      setActiveChallenges(active);
      setAvailableChallenges(available);
    } catch (error) {
      console.error('Failed to load challenges:', error);
      Alert.alert('Error', 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = (challengeId: string) => {
    Alert.alert(
      'Join Challenge',
      'Are you sure you want to join this challenge?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            try {
              await apiService.joinChallenge(challengeId);
              Alert.alert('Success', 'Joined challenge successfully!');
              // Reload challenges to update the lists
              await loadChallenges();
            } catch (error) {
              console.error('Failed to join challenge:', error);
              Alert.alert('Error', 'Failed to join challenge');
            }
          },
        },
      ]
    );
  };

  const handleLeaveChallenge = (challengeId: string) => {
    Alert.alert(
      'Leave Challenge',
      'Are you sure you want to leave this challenge?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            setActiveChallenges(prev => prev.filter(c => c.id !== challengeId));
            Alert.alert('Success', 'You have left the challenge.');
          },
        },
      ]
    );
  };

  const handleCreateChallenge = () => {
    navigation.navigate('CreateChallenge', {});
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getProgressPercentage = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const passedDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    return Math.min(100, Math.max(0, (passedDays / totalDays) * 100));
  };

  const getChallengeTypeIcon = (type: ChallengeType) => {
    switch (type) {
      case 'streak':
        return 'flame';
      case 'completion':
        return 'checkmark-circle';
      case 'custom':
        return 'star';
      default:
        return 'trophy';
    }
  };

  const getChallengeTypeColor = (type: ChallengeType) => {
    switch (type) {
      case 'streak':
        return '#FF8C42';
      case 'completion':
        return '#27AE60';
      case 'custom':
        return '#8E44AD';
      default:
        return '#FF7B7B';
    }
  };

  const renderActiveChallenge = ({ item }: { item: ChallengeWithStats }) => (
    <TouchableOpacity
      style={styles.challengeCard}
      onPress={() => navigation.navigate('ChallengeDetails', { challengeId: item.id })}
    >
      <View style={styles.challengeHeader}>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeTitle}>{item.title}</Text>
          <Text style={styles.challengeDescription}>{item.description}</Text>
        </View>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{item.userRank}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${getProgressPercentage(item.startDate, item.endDate)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(getProgressPercentage(item.startDate, item.endDate))}% • {getDaysRemaining(item.endDate)} days left
        </Text>
      </View>

      <View style={styles.challengeFooter}>
        <Text style={styles.membersText}>{item.members.length} members</Text>
        <Text style={styles.scoreText}>{item.userScore} points</Text>
      </View>
    </TouchableOpacity>
  );

  const renderAvailableChallenge = ({ item }: { item: Challenge }) => (
    <View style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeTitle}>{item.title}</Text>
          <Text style={styles.challengeDescription}>{item.description}</Text>
        </View>
      </View>

      <View style={styles.challengeFooter}>
        <Text style={styles.membersText}>{item.members.length} members</Text>
        <TouchableOpacity 
          style={styles.joinButton}
          onPress={() => handleJoinChallenge(item.id)}
        >
          <Text style={styles.joinButtonText}>Join</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Challenges</Text>
        <TouchableOpacity onPress={handleCreateChallenge}>
          <Ionicons name="add" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'active' && styles.activeTab]}
          onPress={() => setSelectedTab('active')}
        >
          <Text style={[styles.tabText, selectedTab === 'active' && styles.activeTabText]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'available' && styles.activeTab]}
          onPress={() => setSelectedTab('available')}
        >
          <Text style={[styles.tabText, selectedTab === 'available' && styles.activeTabText]}>
            Available
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {selectedTab === 'active' ? (
            activeChallenges.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🏆</Text>
                <Text style={styles.emptyTitle}>No active challenges</Text>
                <Text style={styles.emptySubtitle}>
                  Join a challenge to compete with friends
                </Text>
              </View>
            ) : (
              <FlatList
                data={activeChallenges}
                keyExtractor={item => item.id}
                renderItem={renderActiveChallenge}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )
          ) : (
            availableChallenges.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>No available challenges</Text>
                <Text style={styles.emptySubtitle}>
                  Create a challenge to invite friends
                </Text>
              </View>
            ) : (
              <FlatList
                data={availableChallenges}
                keyExtractor={item => item.id}
                renderItem={renderAvailableChallenge}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )
          )}
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.light,
    color: theme.colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.surface,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.normal,
    color: theme.colors.textTertiary,
  },
  activeTabText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  challengeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  challengeDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  rankBadge: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  rankText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  progressSection: {
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.divider,
    borderRadius: 2,
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  challengeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  membersText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  scoreText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  joinButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  joinButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: theme.spacing.lg,
  },
});