import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components';
import { User, Friend, HabitWithStats, FriendStatus } from '../types';
import { MainTabScreenProps } from '../types/navigation';
import { theme } from '../theme';
import { apiService } from '../services/ApiService';

type FriendsScreenProps = MainTabScreenProps<'Friends'>;

// Import types from MockDataService
import type { FriendWithDetails, FriendRequest } from '../types';

export const FriendsScreen: React.FC<FriendsScreenProps> = ({ navigation }) => {
  const [friends, setFriends] = useState<FriendWithDetails[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);

  useEffect(() => {
    loadFriendsData();
  }, []);

  const loadFriendsData = async () => {
    try {
      const [friendsData, requestsData] = await Promise.all([
        apiService.getFriends(),
        apiService.getFriendRequests()
      ]);
      setFriends(friendsData);
      setFriendRequests(requestsData);
    } catch (error) {
      console.error('Failed to load friends data:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setIsSearching(true);
      try {
        const results = await apiService.searchUsers(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSendFriendRequest = (userId: string) => {
    Alert.alert(
      'Send Friend Request',
      'Send a friend request to this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            // TODO: Implement send friend request
            Alert.alert('Success', 'Friend request sent!');
          },
        },
      ]
    );
  };

  const handleAcceptFriendRequest = (requestId: string) => {
    setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    // TODO: Move to friends list
    Alert.alert('Success', 'Friend request accepted!');
  };

  const handleDeclineFriendRequest = (requestId: string) => {
    setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    Alert.alert('Success', 'Friend request declined.');
  };

  const handleNudgeFriend = (friendId: string, friendName: string) => {
    Alert.alert(
      'Nudge Friend',
      `Send a friendly nudge to ${friendName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Nudge',
          onPress: () => {
            // TODO: Implement nudge
            Alert.alert('Success', `Nudge sent to ${friendName}!`);
          },
        },
      ]
    );
  };

  const renderFriend = ({ item }: { item: FriendWithDetails }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onPress={() => navigation.navigate('FriendProfile', { userId: item.friendUserId })}
    >
      <View style={styles.friendHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.friendName.split(' ').map((n: string) => n[0]).join('')}
          </Text>
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.friendName}</Text>
          <Text style={styles.friendStats}>
            {item.sharedHabits?.length || 0} shared habits
          </Text>
        </View>
        <View style={styles.friendActions}>
          <Text style={styles.streakText}>
            🔥 {item.sharedHabits?.reduce((max, habit) => Math.max(max, habit.currentStreak), 0) || 0}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.user?.name ? item.user.name.split(' ').map((n: string) => n[0]).join('') : 'UN'}
          </Text>
        </View>
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>{item.user?.name || 'Unknown User'}</Text>
          <Text style={styles.requestEmail}>wants to be friends</Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity 
            style={styles.declineButton}
            onPress={() => handleDeclineFriendRequest(item.id)}
          >
            <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => handleAcceptFriendRequest(item.id)}
          >
            <Ionicons name="checkmark" size={16} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSearchResult = ({ item }: { item: User }) => (
    <View style={styles.searchResultCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.split(' ').map(n => n[0]).join('')}
        </Text>
      </View>
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.name}</Text>
        <Text style={styles.searchResultEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addFriendButton}
        onPress={() => handleSendFriendRequest(item.id)}
      >
        <Ionicons name="person-add" size={16} color={theme.colors.white} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
        <TouchableOpacity>
          <Ionicons name="person-add" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends"
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {searchQuery.length > 2 && searchResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            <FlatList
              data={searchResults}
              keyExtractor={item => item.id}
              renderItem={renderSearchResult}
              scrollEnabled={false}
            />
          </View>
        )}

        {friendRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requests</Text>
            <FlatList
              data={friendRequests}
              keyExtractor={item => item.id}
              renderItem={renderFriendRequest}
              scrollEnabled={false}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friends</Text>
          {friends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptySubtitle}>
                Search for friends to share your habit journey
              </Text>
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
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  friendCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  friendStats: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  friendActions: {
    alignItems: 'center',
  },
  streakText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  requestCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  requestEmail: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  requestActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  declineButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  searchResultName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  searchResultEmail: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  addFriendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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