import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/index';
import { NeumorphCard } from '../../components/neumorphism';
import { achievementService, Achievement, UserAchievement, AchievementProgress } from '../../services/premium';

interface AchievementsScreenProps {
  // Navigation props would be defined here
}

const AchievementsScreen: React.FC<AchievementsScreenProps> = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'earned' | 'progress'>('all');
  const [achievementStats, setAchievementStats] = useState<any>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      await achievementService.initialize();
      
      // Check for new achievements
      const newAchievements = await achievementService.checkForNewAchievements();
      if (newAchievements.length > 0) {
        showNewAchievementAlert(newAchievements);
      }
      
      // Load all achievement data
      const progress = await achievementService.getAchievementProgress();
      const userAchievements = achievementService.getUserAchievements();
      const stats = achievementService.getAchievementStats();
      
      setAchievementProgress(progress);
      setUserAchievements(userAchievements);
      setAchievementStats(stats);
      
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const showNewAchievementAlert = (newAchievements: UserAchievement[]) => {
    const firstAchievement = newAchievements[0];
    if (firstAchievement.achievement) {
      Alert.alert(
        '🎉 Achievement Unlocked!',
        `${firstAchievement.achievement.title}\n${firstAchievement.achievement.description}`,
        [
          { text: 'Awesome!', onPress: () => achievementService.markAchievementsSeen() }
        ]
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAchievements();
  };

  const getFilteredAchievements = () => {
    switch (selectedFilter) {
      case 'earned':
        return achievementProgress.filter(a => a.isEarned);
      case 'progress':
        return achievementProgress.filter(a => !a.isEarned);
      default:
        return achievementProgress;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return theme.colors.success;
      case 'rare': return theme.colors.primary;
      case 'epic': return theme.colors.secondary;
      case 'legendary': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const renderStatsCards = () => {
    if (!achievementStats) return null;

    return (
      <View style={styles.statsGrid}>
        <NeumorphCard variant="convex" style={styles.statCard}>
          <Text style={styles.statValue}>{achievementStats.earned}</Text>
          <Text style={styles.statLabel}>Earned</Text>
          <Ionicons name="trophy" size={20} color={theme.colors.warning} />
        </NeumorphCard>
        
        <NeumorphCard variant="convex" style={styles.statCard}>
          <Text style={styles.statValue}>{achievementStats.points}</Text>
          <Text style={styles.statLabel}>Points</Text>
          <Ionicons name="star" size={20} color={theme.colors.primary} />
        </NeumorphCard>
        
        <NeumorphCard variant="convex" style={styles.statCard}>
          <Text style={styles.statValue}>
            {Math.round((achievementStats.earned / achievementStats.total) * 100)}%
          </Text>
          <Text style={styles.statLabel}>Complete</Text>
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
        </NeumorphCard>
        
        <NeumorphCard variant="convex" style={styles.statCard}>
          <Text style={styles.statValue}>{achievementStats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
          <Ionicons name="list" size={20} color={theme.colors.textSecondary} />
        </NeumorphCard>
      </View>
    );
  };

  const renderFilterButtons = () => {
    return (
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'earned' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('earned')}
        >
          <Text style={[styles.filterText, selectedFilter === 'earned' && styles.filterTextActive]}>
            Earned
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'progress' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('progress')}
        >
          <Text style={[styles.filterText, selectedFilter === 'progress' && styles.filterTextActive]}>
            In Progress
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderAchievementItem = ({ item }: { item: AchievementProgress }) => {
    const { achievement, isEarned, progressPercentage, currentValue, targetValue } = item;
    
    return (
      <NeumorphCard 
        variant="convex" 
        style={[styles.achievementCard, isEarned && styles.achievementCardEarned]}
      >
        <View style={styles.achievementHeader}>
          <View style={styles.achievementIcon}>
            <Text style={styles.iconText}>{achievement.icon}</Text>
          </View>
          
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementTitle, isEarned && styles.achievementTitleEarned]}>
              {achievement.title}
            </Text>
            <Text style={styles.achievementDescription}>
              {achievement.description}
            </Text>
            <View style={styles.achievementMeta}>
              <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(achievement.rarity) }]}>
                <Text style={styles.rarityText}>{achievement.rarity.toUpperCase()}</Text>
              </View>
              <Text style={styles.pointsText}>+{achievement.points} pts</Text>
            </View>
          </View>
          
          {isEarned && (
            <View style={styles.earnedBadge}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            </View>
          )}
        </View>
        
        {!isEarned && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progressPercentage}%`,
                    backgroundColor: achievement.color 
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {currentValue} / {targetValue} {achievement.criteria.unit}
            </Text>
          </View>
        )}
      </NeumorphCard>
    );
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
          <Text style={styles.headerTitle}>Achievements</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading achievements...</Text>
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
        <Text style={styles.headerTitle}>Achievements</Text>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderStatsCards()}
        {renderFilterButtons()}
        
        <FlatList
          data={getFilteredAchievements()}
          renderItem={renderAchievementItem}
          keyExtractor={(item) => item.achievementId}
          scrollEnabled={false}
          style={styles.achievementsList}
        />
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: theme.spacing.lg,
  },
  filterButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  filterTextActive: {
    color: theme.colors.white,
  },
  achievementsList: {
    flex: 1,
  },
  achievementCard: {
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  achievementCardEarned: {
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  iconText: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  achievementTitleEarned: {
    color: theme.colors.success,
  },
  achievementDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  achievementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rarityBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
    marginRight: theme.spacing.sm,
  },
  rarityText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
  },
  pointsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  earnedBadge: {
    marginLeft: theme.spacing.sm,
  },
  progressContainer: {
    marginTop: theme.spacing.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default AchievementsScreen;