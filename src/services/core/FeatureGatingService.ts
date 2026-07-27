import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../types';
import { toLocalISODate } from '../../utils/formatting/time';

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
  //
  // v1 has no paid tier and no accounts, so nothing is gated. These stay as
  // methods rather than being deleted because DataService and the reminder
  // screens call them on every create; returning `allowed` keeps that wiring
  // intact for whenever a paid tier is reintroduced.
  async canCreateHabit(_user?: User): Promise<{ allowed: boolean; reason?: string; prompt?: UpgradePrompt }> {
    return { allowed: true };
  }

  async canAccessFeature(featureId: string, _user?: User): Promise<{ allowed: boolean; reason?: string; prompt?: UpgradePrompt }> {
    const feature = this.features.find(f => f.id === featureId);

    if (!feature) {
      return { allowed: false, reason: 'Feature not found' };
    }

    return { allowed: true };
  }

  async canAddReminder(_habitId: string, _user?: User): Promise<{ allowed: boolean; reason?: string; prompt?: UpgradePrompt }> {
    return { allowed: true };
  }

  // Usage tracking methods
  async trackFeatureUsage(featureId: string, action: 'attempt' | 'use' = 'use'): Promise<void> {
    const usage = await this.getFeatureUsage();
    const today = toLocalISODate();
    
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

  async getFeatureLimits(_user?: User): Promise<FeatureLimit[]> {
    const habitCount = await this.getCurrentHabitCount();

    return [
      {
        feature: 'habits',
        limit: -1,
        current: habitCount,
        unlimited: true,
      },
    ];
  }

  // No paid tier in v1, so there is nothing to upsell.
  async shouldShowUpgradePrompt(_user?: User): Promise<UpgradePrompt | null> {
    return null;
  }

  async getUpgradeReasons(_user?: User): Promise<string[]> {
    return [];
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
  async shouldOfferTrial(_user?: User): Promise<boolean> {
    return false;
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

    const totalUsage = Object.values(usage).reduce((sum: number, feature: any) => {
      const featureTotal = typeof feature?.total === 'number' ? feature.total : 0;
      return sum + featureTotal;
    }, 0);

    return {
      habitsCreated: habitCount,
      premiumFeaturesAttempted,
      daysActive: Object.keys(usage.basic_tracking?.daily || {}).length,
      engagementScore: Math.min(100, (habitCount * 10) + (totalUsage * 2) + (premiumFeaturesAttempted * 15)),
    };
  }
}

export const featureGatingService = new FeatureGatingService();