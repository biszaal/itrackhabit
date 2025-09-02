import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NeumorphCard, NeumorphButton, NeumorphismColors } from '../../components/neumorphism';
import { RootStackScreenProps } from '../../types/navigation';
import { socialService, ActivityFeedItem, ShareableContent } from '../../services/social';
import { theme } from '../../theme';

type SocialFeedScreenProps = RootStackScreenProps<'SocialFeed'>;

export const SocialFeedScreen: React.FC<SocialFeedScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'friends'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivityFeed();
  }, [selectedTab]);

  const loadActivityFeed = async () => {
    try {
      setLoading(true);
      let feed: ActivityFeedItem[];
      
      if (selectedTab === 'friends') {
        feed = await socialService.getFriendsActivity();
      } else {
        feed = await socialService.getActivityFeed();
      }
      
      setActivityFeed(feed);
    } catch (error) {
      console.error('Failed to load activity feed:', error);
      Alert.alert('Error', 'Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivityFeed();
    setRefreshing(false);
  };

  const handleShare = async (type: ShareableContent['type']) => {
    try {
      const content = await socialService.generateShareableContent(type);
      const shareText = await socialService.shareToSocial(content, 'twitter');
      
      await Share.share({
        message: shareText,
        title: content.title,
      });
    } catch (error) {
      console.error('Failed to share:', error);
      Alert.alert('Error', 'Failed to share content');
    }
  };

  const getActivityIcon = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'habit_completed':
        return 'checkmark-circle';
      case 'streak_milestone':
        return 'flame';
      case 'achievement_earned':
        return 'trophy';
      case 'group_joined':
        return 'people';
      case 'challenge_won':
        return 'medal';
      default:
        return 'star';
    }
  };

  const getActivityColor = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'habit_completed':
        return '#27AE60';
      case 'streak_milestone':
        return '#FF8C42';
      case 'achievement_earned':
        return '#FFD700';
      case 'group_joined':
        return '#3498DB';
      case 'challenge_won':
        return '#9B59B6';
      default:
        return '#666';
    }
  };

  const getActivityMessage = (item: ActivityFeedItem) => {
    switch (item.type) {
      case 'habit_completed':
        return `completed "${item.habitTitle}"`;
      case 'streak_milestone':
        return `reached a ${item.streakCount}-day streak with "${item.habitTitle}"! 🔥`;
      case 'achievement_earned':
        return `earned the "${item.achievementTitle}" achievement! 🏆`;
      case 'group_joined':
        return `joined the "${item.groupName}" group`;
      case 'challenge_won':
        return `won a habit challenge! 🎉`;
      default:
        return 'made progress on their habits';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  const renderActivityItem = (item: ActivityFeedItem) => (
    <NeumorphCard
      key={item.id}
      variant="subtle"
      colorType="whiteGlass"
      style={styles.activityCard}
      animated
    >
      <View style={styles.activityHeader}>
        <View style={styles.activityUser}>
          <View style={[styles.avatar, { backgroundColor: getActivityColor(item.type) }]}>
            <Ionicons 
              name={getActivityIcon(item.type)} 
              size={16} 
              color="white" 
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.activityMessage}>
              {getActivityMessage(item)}
            </Text>
          </View>
        </View>
        <Text style={styles.timeAgo}>{formatTimeAgo(item.timestamp)}</Text>
      </View>

      <View style={styles.activityFooter}>
        <View style={styles.activityStats}>
          <TouchableOpacity style={styles.statButton}>
            <Ionicons name="heart-outline" size={16} color="#666" />
            <Text style={styles.statText}>{item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statButton}>
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.statText}>{item.comments}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </NeumorphCard>
  );

  const renderShareSection = () => (
    <NeumorphCard
      variant="medium"
      colorType="primaryGlass"
      style={styles.shareCard}
      animated
    >
      <Text style={styles.shareTitle}>Share Your Progress! 📢</Text>
      <Text style={styles.shareSubtitle}>
        Inspire others with your habit journey
      </Text>
      
      <View style={styles.shareButtons}>
        <NeumorphButton
          title="Achievement"
          variant="secondary"
          size="small"
          onPress={() => handleShare('achievement')}
          style={styles.shareButton}
        />
        <NeumorphButton
          title="Streak"
          variant="secondary"
          size="small"
          onPress={() => handleShare('streak')}
          style={styles.shareButton}
        />
        <NeumorphButton
          title="Progress"
          variant="secondary"
          size="small"
          onPress={() => handleShare('progress')}
          style={styles.shareButton}
        />
      </View>
    </NeumorphCard>
  );

  return (
    <View style={[styles.container, { backgroundColor: NeumorphismColors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <NeumorphCard 
          variant="subtle" 
          colorType="whiteGlass" 
          style={[styles.header, { marginTop: insets.top - 45, paddingTop: 0 }]} 
          animated
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Social Feed</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('HabitGroups')} 
            style={styles.groupsButton}
          >
            <Ionicons name="people" size={24} color="#333" />
          </TouchableOpacity>
        </NeumorphCard>

        {/* Tab Selection */}
        <View style={styles.tabContainer}>
          <NeumorphButton
            title="All Activity"
            variant={selectedTab === 'all' ? 'primary' : 'secondary'}
            size="medium"
            onPress={() => setSelectedTab('all')}
            glassIntensity={selectedTab === 'all' ? 'medium' : 'subtle'}
            style={styles.tabButton}
          />
          <NeumorphButton
            title="Friends"
            variant={selectedTab === 'friends' ? 'primary' : 'secondary'}
            size="medium"
            onPress={() => setSelectedTab('friends')}
            glassIntensity={selectedTab === 'friends' ? 'medium' : 'subtle'}
            style={styles.tabButton}
          />
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {renderShareSection()}

          <View style={styles.feedSection}>
            <Text style={styles.sectionTitle}>
              {selectedTab === 'all' ? 'Community Activity' : 'Friends Activity'}
            </Text>
            
            {activityFeed.length === 0 ? (
              <NeumorphCard
                variant="medium"
                colorType="whiteGlass"
                style={styles.emptyCard}
              >
                <Text style={styles.emptyEmoji}>
                  {selectedTab === 'friends' ? '👥' : '🌟'}
                </Text>
                <Text style={styles.emptyTitle}>
                  {selectedTab === 'friends' ? 'No Friend Activity' : 'No Activity Yet'}
                </Text>
                <Text style={styles.emptyDescription}>
                  {selectedTab === 'friends' 
                    ? 'Connect with friends to see their progress!'
                    : 'Complete habits to see activity here!'
                  }
                </Text>
              </NeumorphCard>
            ) : (
              activityFeed.map(renderActivityItem)
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
    height: 64,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  tabButton: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  shareCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  shareTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    marginBottom: theme.spacing.xs,
  },
  shareSubtitle: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  shareButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  shareButton: {
    flex: 1,
  },
  feedSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    marginBottom: theme.spacing.lg,
  },
  activityCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  activityUser: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    marginBottom: theme.spacing.xs,
  },
  activityMessage: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    lineHeight: 18,
  },
  timeAgo: {
    fontSize: theme.fontSize.xs,
    color: '#999',
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityStats: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statText: {
    fontSize: theme.fontSize.xs,
    color: '#666',
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    marginBottom: theme.spacing.xs,
  },
  emptyDescription: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});