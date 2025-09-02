import AsyncStorage from '@react-native-async-storage/async-storage';

class OnboardingService {
  private readonly ONBOARDING_KEY = 'onboarding_completed';
  private readonly ONBOARDING_VERSION_KEY = 'onboarding_version';
  private readonly CURRENT_ONBOARDING_VERSION = '1.0';

  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(this.ONBOARDING_KEY);
      const version = await AsyncStorage.getItem(this.ONBOARDING_VERSION_KEY);
      
      // Check if onboarding is completed AND if it's the current version
      return completed === 'true' && version === this.CURRENT_ONBOARDING_VERSION;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  async markOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [this.ONBOARDING_KEY, 'true'],
        [this.ONBOARDING_VERSION_KEY, this.CURRENT_ONBOARDING_VERSION]
      ]);
    } catch (error) {
      console.error('Error marking onboarding as completed:', error);
    }
  }

  async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.ONBOARDING_KEY,
        this.ONBOARDING_VERSION_KEY
      ]);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }

  async shouldShowOnboarding(): Promise<boolean> {
    const hasCompleted = await this.hasCompletedOnboarding();
    return !hasCompleted;
  }

  // Get user preferences set during onboarding
  async getOnboardingPreferences(): Promise<{
    selectedGoals: string[];
    preferredHabits: string[];
  }> {
    try {
      const goals = await AsyncStorage.getItem('onboarding_goals');
      const habits = await AsyncStorage.getItem('onboarding_habits');
      
      return {
        selectedGoals: goals ? JSON.parse(goals) : [],
        preferredHabits: habits ? JSON.parse(habits) : []
      };
    } catch (error) {
      console.error('Error getting onboarding preferences:', error);
      return {
        selectedGoals: [],
        preferredHabits: []
      };
    }
  }

  // Save user preferences during onboarding
  async saveOnboardingPreferences(preferences: {
    selectedGoals: string[];
    preferredHabits: string[];
  }): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        ['onboarding_goals', JSON.stringify(preferences.selectedGoals)],
        ['onboarding_habits', JSON.stringify(preferences.preferredHabits)]
      ]);
    } catch (error) {
      console.error('Error saving onboarding preferences:', error);
    }
  }

  // Check if specific features should be highlighted for new users
  async shouldHighlightFeature(featureName: string): Promise<boolean> {
    try {
      const highlightedFeatures = await AsyncStorage.getItem('highlighted_features');
      const features = highlightedFeatures ? JSON.parse(highlightedFeatures) : [];
      return !features.includes(featureName);
    } catch (error) {
      console.error('Error checking feature highlight:', error);
      return true;
    }
  }

  async markFeatureHighlighted(featureName: string): Promise<void> {
    try {
      const highlightedFeatures = await AsyncStorage.getItem('highlighted_features');
      const features = highlightedFeatures ? JSON.parse(highlightedFeatures) : [];
      
      if (!features.includes(featureName)) {
        features.push(featureName);
        await AsyncStorage.setItem('highlighted_features', JSON.stringify(features));
      }
    } catch (error) {
      console.error('Error marking feature as highlighted:', error);
    }
  }

  // Get onboarding tips for specific screens
  getScreenTips(screenName: string): string[] {
    const tips: { [key: string]: string[] } = {
      'Home': [
        'Tap the + button to create your first habit',
        'Swipe on habits to mark them complete',
        'Your streak counter shows consecutive days'
      ],
      'Analytics': [
        'View your progress trends over time',
        'Track completion rates by habit',
        'See your longest streaks and achievements'
      ],
      'Achievements': [
        'Earn badges for consistency and milestones',
        'Each achievement gives you points',
        'Share your progress with friends'
      ]
    };

    return tips[screenName] || [];
  }

  // Analytics events for onboarding (could be used for tracking)
  trackOnboardingEvent(eventName: string, properties?: { [key: string]: any }): void {
    // This is where you could integrate analytics like Amplitude, Mixpanel, etc.
    console.log('Onboarding Event:', eventName, properties);
  }
}

export const onboardingService = new OnboardingService();