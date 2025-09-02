import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../types';
import { authService } from '../auth/AuthService';
import { premiumService } from '../premium/PremiumService';

export interface FeatureLimit {
  feature: string;
  limit: number;
  current: number;
  unlimited: boolean;
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  isPremium: boolean;
  category: 'core' | 'analytics' | 'social' | 'customization' | 'productivity';
}

export interface UpgradePrompt {
  type: 'limit_reached' | 'feature_locked' | 'trial_ending' | 'usage_heavy';
  title: string;
  description: string;
  ctaText: string;
  priority: 'high' | 'medium' | 'low';
  feature?: string;
}

class FeatureGatingService {
  private readonly FREE_HABIT_LIMIT = 3;
  private readonly FREE_REMINDER_LIMIT = 1;
  private readonly STORAGE_KEY = 'feature_usage';

  // Define all app features
  private readonly features: PremiumFeature[] = [
    // Core Features
    { id: 'unlimited_habits', name: 'Unlimited Habits', description: 'Create as many habits as you want', icon: 'infinite', isPremium: true, category: 'core' },
    { id: 'basic_tracking', name: 'Basic Tracking', description: 'Daily check-ins and streak counting', icon: 'checkmark-circle', isPremium: false, category: 'core' },
    { id: 'cloud_sync', name: 'Cloud Sync', description: 'Sync your habits across all devices', icon: 'cloud', isPremium: true, category: 'core' },
    
    // Analytics Features
    { id: 'advanced_analytics', name: 'Advanced Analytics', description: 'Detailed charts, heatmaps, and insights', icon: 'analytics', isPremium: true, category: 'analytics' },
    { id: 'streak_heatmaps', name: 'Streak Heatmaps', description: 'Visual calendar showing your consistency', icon: 'calendar', isPremium: true, category: 'analytics' },
    { id: 'habit_correlations', name: 'Habit Correlations', description: 'Discover how your habits affect each other', icon: 'link', isPremium: true, category: 'analytics' },
    { id: 'data_export', name: 'Data Export', description: 'Export your data as CSV or JSON', icon: 'download', isPremium: true, category: 'analytics' },
    
    // Social Features
    { id: 'habit_groups', name: 'Habit Groups', description: 'Join communities with similar goals', icon: 'people', isPremium: true, category: 'social' },
    { id: 'friend_challenges', name: 'Friend Challenges', description: 'Compete with friends in habit challenges', icon: 'trophy', isPremium: true, category: 'social' },
    { id: 'social_sharing', name: 'Social Sharing', description: 'Share your progress on social media', icon: 'share', isPremium: true, category: 'social' },
    { id: 'mentorship', name: 'Find Mentors', description: 'Connect with habit formation experts', icon: 'school', isPremium: true, category: 'social' },
    
    // Customization Features
    { id: 'custom_themes', name: 'Custom Themes', description: 'Dark mode and custom color schemes', icon: 'color-palette', isPremium: true, category: 'customization' },
    { id: 'habit_templates', name: 'Habit Templates', description: 'Pre-built habit routines and templates', icon: 'library', isPremium: true, category: 'customization' },
    { id: 'custom_icons', name: 'Custom Icons', description: 'Personalize habits with custom icons', icon: 'happy', isPremium: true, category: 'customization' },
    
    // Productivity Features
    { id: 'multiple_reminders', name: 'Multiple Reminders', description: 'Set multiple reminders per habit', icon: 'notifications', isPremium: true, category: 'productivity' },
    { id: 'smart_scheduling', name: 'Smart Scheduling', description: 'AI-powered optimal timing suggestions', icon: 'time', isPremium: true, category: 'productivity' },
    { id: 'streak_protection', name: 'Streak Protection', description: 'Recover missed days to maintain streaks', icon: 'shield', isPremium: true, category: 'productivity' },
    { id: 'habit_stacking', name: 'Habit Stacking', description: 'Link habits together for better consistency', icon: 'layers', isPremium: true, category: 'productivity' },
  ];

  async initialize(): Promise<void> {
    // Initialize feature usage tracking
    const usage = await this.getFeatureUsage();
    if (!usage) {
      await this.resetFeatureUsage();
    }
  }

  // Core feature gating methods
  async canCreateHabit(user?: User): Promise<{ allowed: boolean; reason?: string; prompt?: UpgradePrompt }> {
    const currentUser = user || await authService.getCurrentUser();
    if (!currentUser) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    if (premiumService.isPremiumUser(currentUser)) {
      return { allowed: true };
    }

    // Check current habit count
    const habitCount = await this.getCurrentHabitCount();
    
    if (habitCount >= this.FREE_HABIT_LIMIT) {
      const prompt: UpgradePrompt = {
        type: 'limit_reached',
        title: 'Habit Limit Reached',
        description: `You've reached your limit of ${this.FREE_HABIT_LIMIT} habits. Upgrade to Premium for unlimited habits and advanced features!`,
        ctaText: 'Upgrade to Premium',
        priority: 'high',
        feature: 'unlimited_habits',
      };
      
      return { 
        allowed: false, 
        reason: `Free plan limited to ${this.FREE_HABIT_LIMIT} habits`, 
        prompt 
      };
    }

    // Show upgrade nudge when approaching limit
    if (habitCount >= this.FREE_HABIT_LIMIT - 1) {
      const prompt: UpgradePrompt = {
        type: 'limit_reached',
        title: 'Almost at your limit',
        description: `You can create ${this.FREE_HABIT_LIMIT - habitCount} more habit${this.FREE_HABIT_LIMIT - habitCount === 1 ? '' : 's'}. Upgrade to Premium for unlimited habits!`,
        ctaText: 'Upgrade Now',
        priority: 'medium',
        feature: 'unlimited_habits',
      };
      
      return { 
        allowed: true, 
        prompt 
      };
    }

    return { allowed: true };
  }

  async canAccessFeature(featureId: string, user?: User): Promise<{ allowed: boolean; reason?: string; prompt?: UpgradePrompt }> {
    const currentUser = user || await authService.getCurrentUser();
    const feature = this.features.find(f => f.id === featureId);
    
    if (!feature) {
      return { allowed: false, reason: 'Feature not found' };
    }

    if (!feature.isPremium) {
      return { allowed: true };
    }

    if (currentUser && premiumService.isPremiumUser(currentUser)) {
      return { allowed: true };
    }

    const prompt: UpgradePrompt = {
      type: 'feature_locked',
      title: `${feature.name} is Premium`,
      description: feature.description + '. Upgrade to Premium to unlock this feature!',
      ctaText: 'Upgrade to Premium',
      priority: 'high',
      feature: featureId,
    };

    return { 
      allowed: false, 
      reason: 'Premium feature', 
      prompt 
    };
  }

  async canAddReminder(habitId: string, user?: User): Promise<{ allowed: boolean; reason?: string; prompt?: UpgradePrompt }> {
    const currentUser = user || await authService.getCurrentUser();
    
    if (currentUser && premiumService.isPremiumUser(currentUser)) {
      return { allowed: true };
    }

    const reminderCount = await this.getReminderCount(habitId);
    
    if (reminderCount >= this.FREE_REMINDER_LIMIT) {
      const prompt: UpgradePrompt = {
        type: 'limit_reached',
        title: 'Reminder Limit Reached',
        description: `Free plan allows ${this.FREE_REMINDER_LIMIT} reminder per habit. Upgrade to Premium for unlimited reminders and smart scheduling!`,
        ctaText: 'Upgrade to Premium',
        priority: 'medium',
        feature: 'multiple_reminders',
      };
      
      return { 
        allowed: false, 
        reason: `Free plan limited to ${this.FREE_REMINDER_LIMIT} reminder per habit`, 
        prompt 
      };
    }

    return { allowed: true };
  }

  // Usage tracking methods
  async trackFeatureUsage(featureId: string, action: 'attempt' | 'use' = 'use'): Promise<void> {
    const usage = await this.getFeatureUsage();
    const today = new Date().toISOString().split('T')[0];
    
    if (!usage[featureId]) {
      usage[featureId] = { daily: {}, total: 0 };
    }
    
    if (!usage[featureId].daily[today]) {
      usage[featureId].daily[today] = 0;
    }
    
    usage[featureId].daily[today]++;
    usage[featureId].total++;
    
    await this.saveFeatureUsage(usage);
  }

  async getFeatureLimits(user?: User): Promise<FeatureLimit[]> {
    const currentUser = user || await authService.getCurrentUser();
    const isPremium = currentUser && premiumService.isPremiumUser(currentUser);
    const habitCount = await this.getCurrentHabitCount();
    
    const limits: FeatureLimit[] = [
      {
        feature: 'habits',
        limit: isPremium ? -1 : this.FREE_HABIT_LIMIT,
        current: habitCount,
        unlimited: isPremium || false,
      }
    ];

    if (!isPremium) {
      limits.push({
        feature: 'reminders_per_habit',
        limit: this.FREE_REMINDER_LIMIT,
        current: 0, // Would need to calculate per habit
        unlimited: false,
      });
    }

    return limits;
  }

  // Upgrade prompts and nudges
  async shouldShowUpgradePrompt(user?: User): Promise<UpgradePrompt | null> {
    const currentUser = user || await authService.getCurrentUser();
    
    if (!currentUser || premiumService.isPremiumUser(currentUser)) {
      return null;
    }

    // Check for trial ending
    if (currentUser.subscriptionStatus === 'trial') {
      const daysRemaining = premiumService.getTrialDaysRemaining(currentUser);
      if (daysRemaining <= 2) {
        return {
          type: 'trial_ending',
          title: `Trial ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
          description: 'Continue enjoying unlimited habits and premium features by subscribing now!',
          ctaText: 'Subscribe Now',
          priority: 'high',
        };
      }
    }

    // Check usage patterns
    const habitCount = await this.getCurrentHabitCount();
    if (habitCount >= this.FREE_HABIT_LIMIT * 0.8) { // 80% of limit
      return {
        type: 'usage_heavy',
        title: 'You\'re a power user!',
        description: `You're using ${habitCount} of ${this.FREE_HABIT_LIMIT} free habits. Upgrade to Premium for unlimited habits and advanced features!`,
        ctaText: 'Upgrade to Premium',
        priority: 'medium',
      };
    }

    return null;
  }

  async getUpgradeReasons(user?: User): Promise<string[]> {
    const currentUser = user || await authService.getCurrentUser();
    const reasons: string[] = [];
    
    if (!currentUser || premiumService.isPremiumUser(currentUser)) {
      return reasons;
    }

    const habitCount = await this.getCurrentHabitCount();
    
    if (habitCount >= this.FREE_HABIT_LIMIT * 0.5) {
      reasons.push(`You're using ${habitCount}/${this.FREE_HABIT_LIMIT} free habits`);
    }
    
    const usage = await this.getFeatureUsage();
    if (usage.advanced_analytics?.total > 0) {
      reasons.push('You\'ve tried advanced analytics');
    }
    
    if (usage.social_sharing?.total > 0) {
      reasons.push('You\'ve used social features');
    }

    return reasons;
  }

  // Feature discovery
  getPremiumFeatures(): PremiumFeature[] {
    return this.features.filter(f => f.isPremium);
  }

  getFreeFeatures(): PremiumFeature[] {
    return this.features.filter(f => !f.isPremium);
  }

  getFeaturesByCategory(category: PremiumFeature['category']): PremiumFeature[] {
    return this.features.filter(f => f.category === category);
  }

  getFeature(featureId: string): PremiumFeature | undefined {
    return this.features.find(f => f.id === featureId);
  }

  // Trial and onboarding
  async shouldOfferTrial(user?: User): Promise<boolean> {
    const currentUser = user || await authService.getCurrentUser();
    
    if (!currentUser) return false;
    if (currentUser.subscriptionStatus !== 'free') return false;
    if ((currentUser as any).hasUsedTrial) return false;
    
    const habitCount = await this.getCurrentHabitCount();
    
    // Offer trial when they're approaching the limit or have used premium features
    return habitCount >= this.FREE_HABIT_LIMIT - 1;
  }

  // Utility methods
  private async getCurrentHabitCount(): Promise<number> {
    try {
      // This would integrate with your DataService
      const { dataService } = await import('./DataService');
      await dataService.initialize();
      const habits = await dataService.getHabits();
      return habits.filter(h => !h.deletedAt).length;
    } catch (error) {
      console.error('Failed to get habit count:', error);
      return 0;
    }
  }

  private async getReminderCount(habitId: string): Promise<number> {
    // This would check the reminder count for a specific habit
    // For now, return a mock value
    return 1;
  }

  private async getFeatureUsage(): Promise<any> {
    try {
      const usage = await AsyncStorage.getItem(this.STORAGE_KEY);
      return usage ? JSON.parse(usage) : {};
    } catch (error) {
      console.error('Failed to load feature usage:', error);
      return {};
    }
  }

  private async saveFeatureUsage(usage: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));
    } catch (error) {
      console.error('Failed to save feature usage:', error);
    }
  }

  private async resetFeatureUsage(): Promise<void> {
    await this.saveFeatureUsage({});
  }

  // Analytics for premium conversion
  async getConversionMetrics(): Promise<{
    habitsCreated: number;
    premiumFeaturesAttempted: number;
    daysActive: number;
    engagementScore: number;
  }> {
    const habitCount = await this.getCurrentHabitCount();
    const usage = await this.getFeatureUsage();
    
    const premiumFeaturesAttempted = Object.keys(usage).filter(key => 
      this.features.find(f => f.id === key && f.isPremium)
    ).length;

    const totalUsage = Object.values(usage).reduce((sum: number, feature: any) => 
      sum + (feature.total || 0), 0);

    return {
      habitsCreated: habitCount,
      premiumFeaturesAttempted,
      daysActive: Object.keys(usage.basic_tracking?.daily || {}).length,
      engagementScore: Math.min(100, (habitCount * 10) + (totalUsage * 2) + (premiumFeaturesAttempted * 15)),
    };
  }
}

export const featureGatingService = new FeatureGatingService();