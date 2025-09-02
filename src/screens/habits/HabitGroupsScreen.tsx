import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NeumorphCard, NeumorphButton, NeumorphismColors } from '../../components/neumorphism';
import { RootStackScreenProps } from '../../types/navigation';
import { socialService, HabitGroup } from '../../services/social';
import { theme } from '../../theme';

type HabitGroupsScreenProps = RootStackScreenProps<'HabitGroups'>;

const CATEGORIES = [
  { id: 'all', name: 'All', emoji: '🌟' },
  { id: 'health', name: 'Health', emoji: '💪' },
  { id: 'productivity', name: 'Productivity', emoji: '⚡' },
  { id: 'mindfulness', name: 'Mindfulness', emoji: '🧘' },
  { id: 'learning', name: 'Learning', emoji: '📚' },
  { id: 'creative', name: 'Creative', emoji: '🎨' },
  { id: 'social', name: 'Social', emoji: '🤝' },
];

export const HabitGroupsScreen: React.FC<HabitGroupsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<HabitGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'discover' | 'popular' | 'joined'>('discover');

  useEffect(() => {
    loadGroups();
  }, [selectedCategory, selectedTab]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchGroups();
    } else {
      loadGroups();
    }
  }, [searchQuery]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      let groupData: HabitGroup[];
      
      switch (selectedTab) {
        case 'popular':
          groupData = await socialService.getPopularGroups();
          break;
        case 'joined':
          // In a real app, this would show user's joined groups
          groupData = (await socialService.getHabitGroups(selectedCategory)).slice(0, 2);
          break;
        default:
          groupData = await socialService.getHabitGroups(selectedCategory);
      }
      
      setGroups(groupData);
    } catch (error) {
      console.error('Failed to load groups:', error);
      Alert.alert('Error', 'Failed to load habit groups');
    } finally {
      setLoading(false);
    }
  };

  const searchGroups = async () => {
    try {
      const results = await socialService.searchGroups(searchQuery);
      setGroups(results);
    } catch (error) {
      console.error('Failed to search groups:', error);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await socialService.joinGroup(groupId);
      Alert.alert('Success', 'Joined group successfully!');
      await loadGroups();
    } catch (error) {
      console.error('Failed to join group:', error);
      Alert.alert('Error', 'Failed to join group');
    }
  };

  const getDifficultyColor = (difficulty: HabitGroup['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return '#27AE60';
      case 'intermediate': return '#F39C12';
      case 'advanced': return '#E74C3C';
      default: return '#666';
    }
  };

  const renderGroupCard = ({ item }: { item: HabitGroup }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('GroupDetails', { groupId: item.id })}
    >
      <NeumorphCard
        variant="medium"
        colorType="whiteGlass"
        style={styles.groupCard}
        animated
      >
        <View style={styles.groupHeader}>
          <View style={styles.groupIcon}>
            <Text style={styles.groupEmoji}>{item.emoji}</Text>
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupCategory}>
              {CATEGORIES.find(cat => cat.id === item.category)?.name || 'General'}
            </Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
            <Text style={styles.difficultyText}>
              {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={styles.groupDescription}>{item.description}</Text>

        <View style={styles.groupTags}>
          {item.tags.slice(0, 3).map((tag: string, index: number) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.groupFooter}>
          <View style={styles.groupStats}>
            <Ionicons name="people" size={16} color="#666" />
            <Text style={styles.memberCount}>{item.memberCount.toLocaleString()} members</Text>
          </View>
          
          {selectedTab !== 'joined' && (
            <NeumorphButton
              title="Join"
              variant="primary"
              size="small"
              onPress={() => handleJoinGroup(item.id)}
              style={styles.joinButton}
            />
          )}
        </View>
      </NeumorphCard>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <NeumorphCard
      variant="medium"
      colorType="whiteGlass"
      style={styles.emptyCard}
    >
      <Text style={styles.emptyEmoji}>
        {searchQuery ? '🔍' : selectedTab === 'joined' ? '👥' : '🌟'}
      </Text>
      <Text style={styles.emptyTitle}>
        {searchQuery 
          ? 'No groups found'
          : selectedTab === 'joined' 
            ? 'No groups joined yet'
            : 'No groups available'
        }
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery 
          ? 'Try different search terms'
          : selectedTab === 'joined'
            ? 'Join some groups to see them here!'
            : 'Check back later for more groups'
        }
      </Text>
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
          <Text style={styles.headerTitle}>Habit Groups</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Mentors')} 
            style={styles.mentorsButton}
          >
            <Ionicons name="school" size={24} color="#333" />
          </TouchableOpacity>
        </NeumorphCard>

        {/* Search Bar */}
        <NeumorphCard
          variant="medium"
          colorType="whiteGlass"
          style={styles.searchContainer}
          animated
        >
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </NeumorphCard>

        {/* Tab Selection */}
        <View style={styles.tabContainer}>
          <NeumorphButton
            title="Discover"
            variant={selectedTab === 'discover' ? 'primary' : 'secondary'}
            size="small"
            onPress={() => setSelectedTab('discover')}
            glassIntensity={selectedTab === 'discover' ? 'medium' : 'subtle'}
            style={styles.tabButton}
          />
          <NeumorphButton
            title="Popular"
            variant={selectedTab === 'popular' ? 'primary' : 'secondary'}
            size="small"
            onPress={() => setSelectedTab('popular')}
            glassIntensity={selectedTab === 'popular' ? 'medium' : 'subtle'}
            style={styles.tabButton}
          />
          <NeumorphButton
            title="Joined"
            variant={selectedTab === 'joined' ? 'primary' : 'secondary'}
            size="small"
            onPress={() => setSelectedTab('joined')}
            glassIntensity={selectedTab === 'joined' ? 'medium' : 'subtle'}
            style={styles.tabButton}
          />
        </View>

        {/* Category Filter */}
        {!searchQuery && (
          <View style={styles.categoryContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.categoryButtonActive,
                  ]}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.categoryTextActive,
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Groups List */}
        <View style={styles.groupsContainer}>
          {groups.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={groups}
              keyExtractor={item => item.id}
              renderItem={renderGroupCard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.groupsList}
            />
          )}
        </View>
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
  mentorsButton: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    height: 50,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  tabButton: {
    flex: 1,
  },
  categoryContainer: {
    paddingVertical: theme.spacing.sm,
  },
  categoryScroll: {
    paddingHorizontal: theme.spacing.lg,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  categoryText: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    fontWeight: theme.fontWeight.medium,
  },
  categoryTextActive: {
    color: '#333',
    fontWeight: theme.fontWeight.semibold,
  },
  groupsContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  groupsList: {
    paddingBottom: theme.spacing.xl * 2,
  },
  groupCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groupEmoji: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    marginBottom: theme.spacing.xs,
  },
  groupCategory: {
    fontSize: theme.fontSize.sm,
    color: '#666',
  },
  difficultyBadge: {
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  difficultyText: {
    fontSize: theme.fontSize.xs,
    color: 'white',
    fontWeight: theme.fontWeight.medium,
  },
  groupDescription: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  groupTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  tag: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: theme.fontSize.xs,
    color: '#666',
    fontWeight: theme.fontWeight.medium,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  memberCount: {
    fontSize: theme.fontSize.sm,
    color: '#666',
  },
  joinButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
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