import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabScreenProps } from '../../types/navigation';
import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { BadgeList } from '../../components/BadgeComponent';
import { badgeService } from '../../services/social';
import { UserBadge, BadgeProgress, HabitWithStats } from '../../types';
import { dataService } from '../../services/core';
import { userStatsService } from '../../services/analytics';
import {
  NeumorphCard,
  NeumorphButton,
} from '../../components/neumorphism';

type ProfileScreenProps = MainTabScreenProps<'Profile'>;

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [userStats, setUserStats] = useState<any>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailedStats, setDetailedStats] = useState<any>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Initialize data service
      await dataService.initialize();

      // Load habits and comprehensive statistics
      const [habitsData, overallStats] = await Promise.all([
        dataService.getHabits(),
        userStatsService.getUserStats(true) // Force refresh for latest stats
      ]);

      const habitsWithStats = habitsData.map(habit => ({
        ...habit,
        currentStreak: 0,
        longestStreak: 0, 
        completionRate: 0,
        isDoneToday: false,
        totalCompletions: 0
      }));
      
      setHabits(habitsWithStats);
      setUserStats({
        totalHabits: habitsData.length,
        completionRate: overallStats.completionRate,
        currentStreak: overallStats.currentStreak,
        longestStreak: overallStats.longestStreak,
        perfectDays: overallStats.perfectDays,
        totalCompletions: habitsWithStats.reduce((sum, habit) => sum + habit.totalCompletions, 0),
        averageCompletion: habitsWithStats.length > 0 ? 
          Math.round(habitsWithStats.reduce((sum, habit) => sum + habit.completionRate, 0) / habitsWithStats.length) : 0
      });

      // Calculate detailed analytics
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const weekAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      const weeklyStats = await dataService.getDailyStats(weekAgoStr, today);
      const weeklyCompletion = weeklyStats.length > 0 ? 
        Math.round(weeklyStats.reduce((sum, day) => sum + day.completionRate, 0) / weeklyStats.length) : 0;

      setDetailedStats({
        weeklyCompletion,
        habitsCompletedToday: habitsWithStats.filter(h => h.isDoneToday).length,
        mostConsistentHabit: habitsWithStats.reduce((best, current) => 
          current.completionRate > (best?.completionRate || 0) ? current : best, null as HabitWithStats | null
        ),
        weeklyStats
      });

      // Load user badges and progress
      try {
        const [badges, progress] = await Promise.all([
          badgeService.getUserBadges(),
          badgeService.getBadgeProgress()
        ]);
        
        setUserBadges(badges || []);
        setBadgeProgress(progress || []);
      } catch (error) {
        setUserBadges([]);
        setBadgeProgress([]);
      }

    } catch (error) {
      console.error('❌ Failed to load user data:', error);
      setUserStats({
        totalHabits: 0,
        completionRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        perfectDays: 0,
        totalCompletions: 0,
        averageCompletion: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleNotificationSettings = () => {
    navigation.navigate('NotificationSettingsNew' as any);
  };

  const handleAnalytics = () => {
    navigation.navigate('Analytics' as any);
  };

  const handleAchievements = () => {
    navigation.navigate('Achievements' as any);
  };

  const handleOnboarding = () => {
    navigation.navigate('Onboarding' as any);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDataManagement = () => {
    navigation.navigate('DataManagement' as any);
  };

  const handlePrivacySettings = () => {
    navigation.navigate('PrivacySecurity' as any);
  };

  const authenticatedMenuItems = [
    {
      id: 'analytics',
      title: 'Analytics',
      icon: 'bar-chart-outline' as const,
      onPress: handleAnalytics,
    },
    {
      id: 'achievements',
      title: 'Achievements',
      icon: 'trophy-outline' as const,
      onPress: handleAchievements,
    },
    {
      id: 'onboarding',
      title: 'Getting Started Guide',
      icon: 'compass-outline' as const,
      onPress: handleOnboarding,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline' as const,
      onPress: handleNotificationSettings,
    },
    {
      id: 'data',
      title: 'Data Management',
      icon: 'server-outline' as const,
      onPress: handleDataManagement,
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: 'shield-checkmark-outline' as const,
      onPress: handlePrivacySettings,
    },
    {
      id: 'developer',
      title: 'Developer Tools',
      icon: 'code-slash-outline' as const,
      onPress: () => navigation.navigate('DeveloperTools' as any),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle-outline' as const,
      onPress: () => Alert.alert('Help & Support', 'Contact us at support@itrackhabit.com\n\nCommon issues:\n• Sync problems\n• Habit tracking tips\n• Account management'),
    },
    {
      id: 'about',
      title: 'About iTrackHabit',
      icon: 'information-circle-outline' as const,
      onPress: () => Alert.alert('About iTrackHabit', `Version 1.0.0\n\nA simple and effective habit tracking app designed to help you build consistent routines and achieve your goals.\n\n© 2025 iTrackHabit`),
    },
    {
      id: 'logout',
      title: 'Sign Out',
      icon: 'log-out-outline' as const,
      onPress: handleLogout,
    },
  ];

  const guestMenuItems = [
    {
      id: 'login',
      title: 'Sign In',
      icon: 'log-in-outline' as const,
      onPress: () => navigation.navigate('Login' as any),
    },
    {
      id: 'register',
      title: 'Create Account',
      icon: 'person-add-outline' as const,
      onPress: () => navigation.navigate('Register' as any),
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: 'bar-chart-outline' as const,
      onPress: handleAnalytics,
    },
    {
      id: 'achievements',
      title: 'Achievements',
      icon: 'trophy-outline' as const,
      onPress: handleAchievements,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline' as const,
      onPress: handleNotificationSettings,
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle-outline' as const,
      onPress: () => Alert.alert('Help & Support', 'Contact us at support@itrackhabit.com\n\nCommon issues:\n• Sync problems\n• Habit tracking tips\n• Account management'),
    },
    {
      id: 'about',
      title: 'About iTrackHabit',
      icon: 'information-circle-outline' as const,
      onPress: () => Alert.alert('About iTrackHabit', `Version 1.0.0\n\nA simple and effective habit tracking app designed to help you build consistent routines and achieve your goals.\n\n© 2025 iTrackHabit`),
    },
  ];

  const menuItems = isAuthenticated ? authenticatedMenuItems : guestMenuItems;

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <SafeAreaView style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <NeumorphCard
            variant="medium"
            colorType="whiteGlass"
            style={styles.profileCard}
            animated={true}
          >
            <View style={styles.profileSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.name || 'User').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
            </View>
          </NeumorphCard>

          {/* Main Stats */}
          {userStats && !loading && (
            <NeumorphCard
              variant="medium"
              colorType="primaryGlass"
              style={styles.statsCard}
              animated={true}
            >
              <View style={styles.statsSection}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userStats.totalHabits}</Text>
                  <Text style={styles.statLabel}>Habits</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userStats.currentStreak}</Text>
                  <Text style={styles.statLabel}>Current Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userStats.completionRate}%</Text>
                  <Text style={styles.statLabel}>Success Rate</Text>
                </View>
              </View>
            </NeumorphCard>
          )}

          {/* Detailed Analytics */}
          {userStats && detailedStats && !loading && (
            <NeumorphCard
              variant="medium"
              colorType="successGlass"
              style={styles.analyticsCard}
              animated={true}
            >
              <View style={styles.analyticsHeader}>
                <Ionicons name="analytics-outline" size={24} color={theme.colors.text} />
                <Text style={styles.analyticsTitle}>Analytics</Text>
              </View>
              
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsNumber}>{userStats.longestStreak}</Text>
                  <Text style={styles.analyticsLabel}>Longest Streak</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsNumber}>{userStats.perfectDays}</Text>
                  <Text style={styles.analyticsLabel}>Perfect Days</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsNumber}>{userStats.totalCompletions}</Text>
                  <Text style={styles.analyticsLabel}>Total Completions</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsNumber}>{detailedStats.weeklyCompletion}%</Text>
                  <Text style={styles.analyticsLabel}>7-Day Average</Text>
                </View>
              </View>

              {/* Today's Progress */}
              <View style={styles.todaySection}>
                <Text style={styles.todayTitle}>Today's Progress</Text>
                <Text style={styles.todaySubtitle}>
                  {detailedStats.habitsCompletedToday} of {userStats.totalHabits} habits completed
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${userStats.totalHabits > 0 ? (detailedStats.habitsCompletedToday / userStats.totalHabits) * 100 : 0}%` }
                    ]} 
                  />
                </View>
              </View>

              {/* Most Consistent Habit */}
              {detailedStats.mostConsistentHabit && (
                <View style={styles.bestHabitSection}>
                  <Text style={styles.bestHabitTitle}>Most Consistent Habit</Text>
                  <View style={styles.bestHabitCard}>
                    <View style={[styles.habitColorDot, { backgroundColor: detailedStats.mostConsistentHabit.color || theme.colors.primary }]} />
                    <View style={styles.bestHabitInfo}>
                      <Text style={styles.bestHabitName}>{detailedStats.mostConsistentHabit.title}</Text>
                      <Text style={styles.bestHabitRate}>{detailedStats.mostConsistentHabit.completionRate}% completion rate</Text>
                    </View>
                  </View>
                </View>
              )}
            </NeumorphCard>
          )}

          {/* Loading State */}
          {loading && (
            <NeumorphCard
              variant="medium"
              colorType="whiteGlass"
              style={styles.loadingCard}
              animated={true}
            >
              <View style={styles.loadingSection}>
                <Text style={styles.loadingText}>Loading your stats...</Text>
              </View>
            </NeumorphCard>
          )}

          {/* Badges */}
          {user && (
            <NeumorphCard
              variant="light"
              colorType="successGlass"
              style={styles.badgesCard}
              animated={true}
            >
              <BadgeList 
                badges={userBadges} 
                badgeProgress={badgeProgress}
                maxVisible={6}
              />
            </NeumorphCard>
          )}

          {/* Menu Items */}
          <NeumorphCard
            variant="medium"
            colorType="whiteGlass"
            style={styles.menuCard}
            animated={true}
          >
            <View style={styles.menuSection}>
              {menuItems.map((item, index) => (
                <NeumorphCard
                  key={item.id}
                  variant="light"
                  colorType="whiteGlass"
                  style={[
                    styles.menuItem,
                    index === menuItems.length - 1 && { marginBottom: 0 }
                  ]}
                  onPress={item.onPress}
                  animated={true}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name={item.icon} size={22} color={theme.colors.textSecondary} />
                    <Text style={styles.menuItemText}>{item.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                </NeumorphCard>
              ))}
            </View>
          </NeumorphCard>

          {/* Features Section */}
          <NeumorphCard
            variant="medium"
            colorType="whiteGlass"
            style={styles.featuresCard}
            animated={true}
          >
            <Text style={styles.sectionTitle}>Explore Features</Text>
            
            <View style={styles.featureGrid}>
              <TouchableOpacity 
                style={styles.featureButton}
                onPress={() => navigation.navigate('SocialFeed' as any)}
              >
                <View style={styles.featureIcon}>
                  <Ionicons name="people" size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.featureText}>Social Feed</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.featureButton}
                onPress={() => navigation.navigate('HabitGroups' as any)}
              >
                <View style={styles.featureIcon}>
                  <Ionicons name="library" size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.featureText}>Habit Groups</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.featureButton}
                onPress={() => navigation.navigate('Mentors' as any)}
              >
                <View style={styles.featureIcon}>
                  <Ionicons name="school" size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.featureText}>Find Mentors</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.featureButton}
                onPress={() => navigation.navigate('AIInsights' as any)}
              >
                <View style={styles.featureIcon}>
                  <Ionicons name="bulb" size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.featureText}>AI Insights</Text>
              </TouchableOpacity>
            </View>
          </NeumorphCard>

          {/* Sign Out Button */}
          {user && (
            <NeumorphButton
              title="Sign Out"
              variant="secondary"
              size="large"
              onPress={handleSignOut}
              glassIntensity="strong"
              style={styles.signOutButton}
            />
          )}

          {/* Sign In Prompt */}
          {!user && (
            <NeumorphCard
              variant="medium"
              colorType="primaryGlass"
              style={styles.signInCard}
              animated={true}
            >
              <View style={styles.signInPrompt}>
                <Text style={styles.signInText}>Sign in to sync your habits across devices</Text>
                <NeumorphButton
                  title="Sign In"
                  variant="primary"
                  size="large"
                  onPress={() => navigation.navigate('Login' as any)}
                  glassIntensity="strong"
                  style={styles.signInButton}
                />
              </View>
            </NeumorphCard>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100, // Add extra space for tab bar
  },
  profileCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: 0,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  userName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  statsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: 0,
  },
  statsSection: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
  },
  badgesCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.borderSoft,
    marginHorizontal: theme.spacing.md,
  },
  // Analytics Styles
  analyticsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  analyticsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  analyticsItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  analyticsNumber: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  analyticsLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todaySection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  todayTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  todaySubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 4,
  },
  bestHabitSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  bestHabitTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  bestHabitCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },
  bestHabitInfo: {
    flex: 1,
  },
  bestHabitName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  bestHabitRate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  loadingCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: 0,
  },
  loadingSection: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  menuCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: 0,
  },
  menuSection: {
    padding: theme.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  featuresCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  featureButton: {
    width: '48%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  featureText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  signOutButton: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  signInCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    padding: 0,
  },
  signInPrompt: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  signInText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  signInButton: {
    marginTop: theme.spacing.lg,
  },
});