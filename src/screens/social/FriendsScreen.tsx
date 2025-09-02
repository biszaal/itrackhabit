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
import { User, Friend, HabitWithStats, FriendStatus, FriendWithDetails, FriendRequest } from '../../types';
import { MainTabScreenProps } from '../../types/navigation';
import { theme } from '../../theme';
import { friendService } from '../../services/social';
import { useAuth } from '../../contexts/AuthContext';
import {
  NeumorphCard,
  NeumorphInput,
  NeumorphButton,
  NeumorphismColors,
} from '../../components/neumorphism';

type FriendsScreenProps = MainTabScreenProps<'Friends'>;

export const FriendsScreen: React.FC<FriendsScreenProps> = ({ navigation }) => {
  const { isAuthenticated, user } = useAuth();
  const [friends, setFriends] = useState<FriendWithDetails[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadFriendsData();
    }
  }, [isAuthenticated]);

  const loadFriendsData = async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      const [friendsData, requestsData] = await Promise.all([
        friendService.getFriends(),
        friendService.getPendingFriendRequests()
      ]);
      setFriends(friendsData || []);
      setFriendRequests(requestsData || []);
    } catch (error) {
      setFriends([]);
      setFriendRequests([]);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await friendService.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('Error', 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    // Check if already friends or request exists
    const isAlreadyFriend = friends.some(friend => friend.id === userId);
    const requestExists = friendRequests.some(request => 
      (request.fromUserId === userId || request.toUserId === userId)
    );

    if (isAlreadyFriend) {
      Alert.alert('Info', 'You are already friends with this user');
      return;
    }

    if (requestExists) {
      Alert.alert('Info', 'Friend request already sent or pending');
      return;
    }

    Alert.alert(
      'Send Friend Request',
      'Send a friend request to this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await friendService.sendFriendRequest(userId);
              Alert.alert('Success', 'Friend request sent!');
              await loadFriendsData();
            } catch (error) {
              console.error('Failed to send friend request:', error);
              Alert.alert('Error', 'Failed to send friend request');
            }
          },
        },
      ]
    );
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      await friendService.acceptFriendRequest(requestId);
      Alert.alert('Success', 'Friend request accepted!');
      await loadFriendsData();
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleDeclineFriendRequest = async (requestId: string) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this friend request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendService.declineFriendRequest(requestId);
              await loadFriendsData();
            } catch (error) {
              console.error('Failed to decline friend request:', error);
              Alert.alert('Error', 'Failed to decline friend request');
            }
          },
        },
      ]
    );
  };

  const renderSearchResult = ({ item }: { item: User }) => (
    <NeumorphCard
      variant="subtle"
      colorType="whiteGlass"
      style={styles.friendCard}
      animated={true}
    >
      <View style={styles.friendInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendEmail}>{item.email}</Text>
        </View>
      </View>
      <NeumorphButton
        title="Add"
        variant="primary"
        size="small"
        onPress={() => handleSendFriendRequest(item.id)}
        glassIntensity="medium"
        style={styles.actionButton}
      />
    </NeumorphCard>
  );

  const renderFriend = ({ item }: { item: FriendWithDetails }) => (
    <NeumorphCard
      variant="subtle"
      colorType="successGlass"
      style={styles.friendCard}
      onPress={() => navigation.navigate('FriendProfile', { userId: item.id })}
      animated={true}
    >
      <View style={styles.friendInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.friendName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.friendName}</Text>
          <Text style={styles.friendStats}>
            Active user • Connected
          </Text>
        </View>
      </View>
      <View style={styles.friendActions}>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
      </View>
    </NeumorphCard>
  );

  const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
    <NeumorphCard
      variant="subtle"
      colorType="primaryGlass"
      style={styles.friendCard}
      animated={true}
    >
      <View style={styles.friendInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.user?.name || 'Unknown User'}</Text>
          <Text style={styles.requestTime}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <NeumorphButton
          title="Accept"
          variant="primary"
          size="small"
          onPress={() => handleAcceptFriendRequest(item.id)}
          glassIntensity="medium"
          style={styles.acceptButton}
        />
        <NeumorphButton
          title="Decline"
          variant="secondary"
          size="small"
          onPress={() => handleDeclineFriendRequest(item.id)}
          glassIntensity="medium"
          style={styles.declineButton}
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
                Please log in to connect with friends and share your progress.
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
          animated={true}
        >
          <Text style={styles.headerTitle}>Friends</Text>
          <NeumorphButton
            title=""
            variant="secondary"
            size="small"
            onPress={() => navigation.navigate('ContactSelection' as any)}
            glassIntensity="light"
            style={styles.addButton}
          />
        </NeumorphCard>

        <NeumorphCard
          variant="light"
          colorType="whiteGlass"
          style={styles.searchCard}
          animated={true}
        >
          <NeumorphInput
            placeholder="Search friends"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            glassIntensity="subtle"
          />
        </NeumorphCard>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {searchQuery.length > 2 && searchResults.length > 0 && (
            <NeumorphCard
              variant="medium"
              colorType="whiteGlass"
              style={styles.sectionCard}
              animated={true}
            >
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Search Results</Text>
                <FlatList
                  data={searchResults}
                  keyExtractor={item => item.id}
                  renderItem={renderSearchResult}
                  scrollEnabled={false}
                />
              </View>
            </NeumorphCard>
          )}

          {friendRequests.length > 0 && (
            <NeumorphCard
              variant="medium"
              colorType="primaryGlass"
              style={styles.sectionCard}
              animated={true}
            >
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Friend Requests</Text>
                <FlatList
                  data={friendRequests}
                  keyExtractor={item => item.id}
                  renderItem={renderFriendRequest}
                  scrollEnabled={false}
                />
              </View>
            </NeumorphCard>
          )}

          <NeumorphCard
            variant="medium"
            colorType="whiteGlass"
            style={styles.sectionCard}
            animated={true}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Friends ({friends.length})</Text>
              {friends.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>👥</Text>
                  <Text style={styles.emptyTitle}>No friends yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Search for friends above or invite them to join iTrackHabit!
                  </Text>
                  <NeumorphButton
                    title="Invite from Contacts"
                    variant="primary"
                    size="medium"
                    onPress={() => navigation.navigate('ContactSelection' as any)}
                    glassIntensity="medium"
                    style={styles.inviteContactsButton}
                  />
                </View>
              ) : (
                <FlatList
                  data={friends}
                  keyExtractor={item => item.id}
                  renderItem={renderFriend}
                  scrollEnabled={false}
                />
              )}
            </View>
          </NeumorphCard>
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
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.light,
    color: theme.colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
  },
  searchCard: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  scrollView: {
    flex: 1,
  },
  sectionCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: 0,
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  friendStats: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  requestTime: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  friendActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  actionButton: {
    paddingHorizontal: theme.spacing.md,
  },
  acceptButton: {
    paddingHorizontal: theme.spacing.sm,
  },
  declineButton: {
    paddingHorizontal: theme.spacing.sm,
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
  inviteContactsButton: {
    marginTop: theme.spacing.lg,
    alignSelf: 'center',
  },
});