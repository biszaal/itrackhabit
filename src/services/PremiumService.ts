import { SubscriptionPlan, User } from '../types';
import { authService } from './AuthService';
import { AppConfig } from '../config/app';

class PremiumService {
  private readonly subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'premium_monthly',
      name: 'Premium Monthly',
      price: 4.99,
      currency: 'USD',
      interval: 'monthly',
      maxHabits: null, // unlimited
      features: [
        'Unlimited habits',
        'Advanced analytics',
        'Cloud sync across devices',
        'Custom themes',
        'Export data',
        'Priority support',
        'Health app integration',
        'Smart reminders'
      ]
    },
    {
      id: 'premium_yearly',
      name: 'Premium Yearly',
      price: 49.99,
      currency: 'USD',
      interval: 'yearly',
      maxHabits: null, // unlimited
      features: [
        'Unlimited habits',
        'Advanced analytics',
        'Cloud sync across devices',
        'Custom themes',
        'Export data',
        'Priority support',
        'Health app integration',
        'Smart reminders',
        '2 months free!'
      ]
    }
  ];

  getSubscriptionPlans(): SubscriptionPlan[] {
    return this.subscriptionPlans;
  }

  getRecommendedPlan(): SubscriptionPlan {
    return this.subscriptionPlans.find(plan => plan.interval === 'yearly') || this.subscriptionPlans[0];
  }

  async purchaseSubscription(planId: string): Promise<User> {
    const plan = this.subscriptionPlans.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Invalid subscription plan');
    }

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real app, this would integrate with App Store/Play Store
    const updatedUser = await authService.upgradeToPremium();
    
    // Track subscription analytics
    this.trackSubscriptionEvent('purchase', planId);
    
    return updatedUser;
  }

  async restorePurchases(): Promise<User | null> {
    try {
      // Simulate restore purchases API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // In a real app, this would check with App Store/Play Store
      // For demo, we'll simulate finding an existing purchase
      if (Math.random() > 0.7) {
        const updatedUser = await authService.upgradeToPremium();
        this.trackSubscriptionEvent('restore', 'premium_yearly');
        return updatedUser;
      }

      return null; // No purchases found
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw new Error('Failed to restore purchases. Please try again.');
    }
  }

  async startFreeTrial(): Promise<User> {
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    if (currentUser.subscriptionStatus !== 'free') {
      throw new Error('Trial already used or user has active subscription');
    }

    const updatedUser = await authService.upgradeToTrial();
    this.trackSubscriptionEvent('trial_start', 'free_trial');
    
    return updatedUser;
  }

  getTrialDaysRemaining(user: User): number {
    if (user.subscriptionStatus !== 'trial' || !user.trialStartDate) {
      return 0;
    }

    const trialStart = new Date(user.trialStartDate);
    const trialEnd = new Date(trialStart.getTime() + AppConfig.premium.trialDays * 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now >= trialEnd) {
      return 0;
    }

    const msRemaining = trialEnd.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
    
    return Math.max(0, daysRemaining);
  }

  isPremiumUser(user: User): boolean {
    return user.subscriptionStatus === 'premium' || 
           (user.subscriptionStatus === 'trial' && !authService.isTrialExpired(user));
  }

  canAddHabit(user: User, currentHabitCount: number): boolean {
    const maxHabits = authService.getMaxHabitsForUser(user);
    return maxHabits === Infinity || currentHabitCount < maxHabits;
  }

  getHabitLimitMessage(user: User): string {
    if (this.isPremiumUser(user)) {
      return 'Unlimited habits available';
    }

    const maxHabits = authService.getMaxHabitsForUser(user);
    return `${maxHabits} habits maximum (Free plan)`;
  }

  shouldShowUpgradePrompt(user: User, currentHabitCount: number): boolean {
    if (this.isPremiumUser(user)) {
      return false;
    }

    const maxHabits = authService.getMaxHabitsForUser(user);
    
    // Show upgrade prompt when user is close to limit or has reached it
    return currentHabitCount >= maxHabits - 1;
  }

  getUpgradePromptMessage(user: User, currentHabitCount: number): string {
    const maxHabits = authService.getMaxHabitsForUser(user);
    
    if (currentHabitCount >= maxHabits) {
      return `You've reached your limit of ${maxHabits} habits. Upgrade to Premium for unlimited habits and advanced features!`;
    }
    
    const remaining = maxHabits - currentHabitCount;
    return `Only ${remaining} habit${remaining === 1 ? '' : 's'} remaining. Upgrade to Premium for unlimited habits!`;
  }

  calculateYearlySavings(): number {
    const monthlyPlan = this.subscriptionPlans.find(p => p.interval === 'monthly');
    const yearlyPlan = this.subscriptionPlans.find(p => p.interval === 'yearly');
    
    if (!monthlyPlan || !yearlyPlan) return 0;
    
    const yearlyAsMonthly = monthlyPlan.price * 12;
    return yearlyAsMonthly - yearlyPlan.price;
  }

  getSubscriptionFeatures(user: User): string[] {
    if (this.isPremiumUser(user)) {
      return this.subscriptionPlans[0].features;
    }

    return [
      `Up to ${AppConfig.premium.maxFreeHabits} habits`,
      'Basic habit tracking',
      'Local data storage',
      'Standard themes'
    ];
  }

  private trackSubscriptionEvent(event: string, planId: string): void {
    // In a real app, this would send analytics events
    console.log(`Subscription event: ${event} for plan: ${planId}`);
    
    // Example analytics tracking:
    // analytics.track('subscription_event', {
    //   event_type: event,
    //   plan_id: planId,
    //   timestamp: new Date().toISOString()
    // });
  }

  // Method to check if user needs to be downgraded after trial/subscription expires
  async checkAndHandleSubscriptionExpiry(user: User): Promise<User | null> {
    if (user.subscriptionStatus === 'trial' && authService.isTrialExpired(user)) {
      // Trial has expired, downgrade to free
      const updatedUser: User = {
        ...user,
        subscriptionStatus: 'free',
        updatedAt: new Date().toISOString(),
      };

      // In a real app, this would be handled by backend
      // For demo, we'll update local storage
      const userData = JSON.stringify(updatedUser);
      await import('@react-native-async-storage/async-storage').then(module => 
        module.default.setItem('user_data', userData)
      );

      this.trackSubscriptionEvent('trial_expired', 'free_trial');
      return updatedUser;
    }

    if (user.subscriptionStatus === 'premium' && user.subscriptionEndDate) {
      const subscriptionEnd = new Date(user.subscriptionEndDate);
      if (new Date() > subscriptionEnd) {
        // Premium subscription has expired
        const updatedUser: User = {
          ...user,
          subscriptionStatus: 'free',
          updatedAt: new Date().toISOString(),
        };

        const userData = JSON.stringify(updatedUser);
        await import('@react-native-async-storage/async-storage').then(module => 
          module.default.setItem('user_data', userData)
        );

        this.trackSubscriptionEvent('subscription_expired', 'premium');
        return updatedUser;
      }
    }

    return null; // No changes needed
  }
}

export const premiumService = new PremiumService();