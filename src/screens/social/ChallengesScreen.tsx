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
import { ChallengeWithStats, Challenge, ChallengeType, ChallengeWithParticipants } from '../../types';
import { MainTabScreenProps } from '../../types/navigation';
import { theme } from '../../theme';
import { challengeService } from '../../services/social';
import { useAuth } from '../../contexts/AuthContext';
import {
  NeumorphCard,
  NeumorphButton,
  NeumorphismColors,
} from '../../components/neumorphism';

type ChallengesScreenProps = MainTabScreenProps<'Challenges'>;

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();
  const [activeChallenges, setActiveChallenges] = useState<ChallengeWithParticipants[]>([]);
  const [availableChallenges, setAvailableChallenges] = useState<ChallengeWithParticipants[]>([]);
  const [selectedTab, setSelectedTab] = useState<'active' | 'available' | 'friends'>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadChallenges();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadChallenges = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const [active, challengesData, friends] = await Promise.all([
        challengeService.getUserChallenges(),
        challengeService.getChallenges(),
        challengeService.getFriendChallenges(),
      ]);
      
      const activeWithStats = active.map((c: any) => ({
        ...c,
        participants: [],
        participantCount: 0,
        leaderboard: []
      }));
      
      const availableWithStats = challengesData.available.map((c: any) => ({
        ...c,
        participants: [],
        participantCount: 0,
        leaderboard: []
      }));
      
      const friendsWithStats = friends.map((c: any) => ({
        ...c,
        participants: [],
        participantCount: 0,
        leaderboard: []
      }));
      
      setActiveChallenges(activeWithStats);
      
      if (selectedTab === 'friends') {
        setAvailableChallenges(friendsWithStats);
      } else {
        setAvailableChallenges(availableWithStats);
      }
    } catch (error) {
      console.error('Failed to load challenges:', error);
      Alert.alert('Error', 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    Alert.alert(
      'Join Challenge',
      'Are you sure you want to join this challenge?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            try {
              await challengeService.joinChallenge(challengeId);
              Alert.alert('Success', 'Joined challenge successfully!');
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

  const handleLeaveChallenge = async (challengeId: string) => {
    Alert.alert(
      'Leave Challenge',
      'Are you sure you want to leave this challenge?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await challengeService.leaveChallenge(challengeId);
              Alert.alert('Success', 'You have left the challenge');
              await loadChallenges();
            } catch (error) {
              console.error('Failed to leave challenge:', error);
              Alert.alert('Error', 'Failed to leave challenge');
            }
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

  const renderActiveChallenge = ({ item }: { item: ChallengeWithParticipants }) => {
    const userRank = item.userParticipation?.rank || 0;
    const userScore = item.userParticipation?.score || 0;
    
    return (
      <NeumorphCard
        variant="medium"
        colorType="successGlass"
        style={styles.challengeCard}
        onPress={() => navigation.navigate('ChallengeDetails', { challengeId: item.id })}
        animated={true}
      >
        <View style={styles.challengeHeader}>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeTitle}>{item.title}</Text>
            <Text style={styles.challengeDescription}>
              {item.description || `${item.habitType} • ${item.targetValue} ${item.targetUnit} daily`}
            </Text>
          </View>
          {userRank > 0 && (
            <NeumorphCard
              variant="strong"
              colorType="primaryGlass"
              style={styles.rankBadge}
            >
              <Text style={styles.rankText}>#{userRank}</Text>
            </NeumorphCard>
          )}
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
          <Text style={styles.membersText}>{item.participantCount} members</Text>
          <Text style={styles.scoreText}>{userScore} points</Text>
        </View>
      </NeumorphCard>
    );
  };

  const renderAvailableChallenge = ({ item }: { item: ChallengeWithParticipants }) => (
    <NeumorphCard
      variant="medium"
      colorType="whiteGlass"
      style={styles.challengeCard}
      animated={true}
    >
      <View style={styles.challengeHeader}>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeTitle}>{item.title}</Text>
          <Text style={styles.challengeDescription}>
            {item.description || `${item.habitType} • ${item.targetValue} ${item.targetUnit} daily`}
          </Text>
          {item.creator && (
            <Text style={styles.creatorText}>by {item.creator.name}</Text>
          )}
        </View>
      </View>

      <View style={styles.challengeFooter}>
        <Text style={styles.membersText}>{item.participantCount} members • {getDaysRemaining(item.endDate)} days left</Text>
        <NeumorphButton
          title="Join"
          variant="primary"
          size="small"
          onPress={() => handleJoinChallenge(item.id)}
          glassIntensity="strong"
          style={styles.joinButton}
        />
      </View>
    </NeumorphCard>
  );

  // Show login required message if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: NeumorphismColors.background }]}>
        <SafeAreaView style={styles.container}>
          <View style={styles.notAuthenticatedContainer}>
            <NeumorphCard
              variant="convex"
              size="large"
              style={styles.notAuthenticatedCard}
            >
              <Text style={styles.notAuthenticatedTitle}>Login Required</Text>
              <Text style={styles.notAuthenticatedText}>
                Please log in to view and participate in challenges.
              </Text>
            </NeumorphCard>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <SafeAreaView style={styles.container}>
        <NeumorphCard
          variant="medium"
          colorType="whiteGlass"
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Challenges</Text>
          <NeumorphButton
            title=""
            variant="primary"
            size="small"
            onPress={handleCreateChallenge}
            glassIntensity="strong"
            style={styles.addButton}
          />
        </NeumorphCard>

        <NeumorphCard
          variant="light"
          colorType="whiteGlass"
          style={styles.tabCard}
        >
          <View style={styles.tabContainer}>
            <NeumorphButton
              title="Active"
              variant={selectedTab === 'active' ? 'primary' : 'secondary'}
              size="small"
              onPress={() => setSelectedTab('active')}
              glassIntensity={selectedTab === 'active' ? 'medium' : 'subtle'}
              style={styles.tab}
            />
            <NeumorphButton
              title="Discover"
              variant={selectedTab === 'available' ? 'primary' : 'secondary'}
              size="small"
              onPress={() => setSelectedTab('available')}
              glassIntensity={selectedTab === 'available' ? 'medium' : 'subtle'}
              style={styles.tab}
            />
            <NeumorphButton
              title="Friends"
              variant={selectedTab === 'friends' ? 'primary' : 'secondary'}
              size="small"
              onPress={() => setSelectedTab('friends')}
              glassIntensity={selectedTab === 'friends' ? 'medium' : 'subtle'}
              style={styles.tab}
            />
          </View>
        </NeumorphCard>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {selectedTab === 'active' ? (
              activeChallenges.length === 0 ? (
                <NeumorphCard
                  variant="medium"
                  colorType="whiteGlass"
                  style={styles.emptyCard}
                >
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyEmoji}>🏆</Text>
                    <Text style={styles.emptyTitle}>No active challenges</Text>
                    <Text style={styles.emptySubtitle}>
                      Join a challenge to compete with friends
                    </Text>
                  </View>
                </NeumorphCard>
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
                <NeumorphCard
                  variant="medium"
                  colorType="whiteGlass"
                  style={styles.emptyCard}
                >
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyEmoji}>{selectedTab === 'friends' ? '👥' : '🔍'}</Text>
                    <Text style={styles.emptyTitle}>
                      {selectedTab === 'friends' ? 'No friend challenges' : 'No available challenges'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {selectedTab === 'friends' 
                        ? 'Your friends haven\'t created any challenges yet'
                        : 'Create a challenge to invite friends'
                      }
                    </Text>
                  </View>
                </NeumorphCard>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  addButton: {
    width: 40,
    height: 40,
  },
  tabCard: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.light,
    color: theme.colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  tab: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  challengeCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  emptyCard: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: 0,
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
  creatorText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
  },
  rankBadge: {
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
    paddingHorizontal: theme.spacing.md,
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
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  notAuthenticatedCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  notAuthenticatedTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  notAuthenticatedText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});