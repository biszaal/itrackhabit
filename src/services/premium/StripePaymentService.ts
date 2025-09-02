import { Alert } from 'react-native';
import { authService } from '../auth';

export interface StripePaymentIntent {
  id: string;
  client_secret: string;
  status: string;
  amount: number;
  currency: string;
}

export interface SubscriptionPurchase {
  success: boolean;
  subscriptionId?: string;
  paymentIntentId?: string;
  error?: string;
  requiresAction?: boolean;
  actionUrl?: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

class StripePaymentService {
  private readonly API_BASE_URL = 'https://your-backend-api.com'; // Replace with your actual backend URL
  private readonly STRIPE_PUBLISHABLE_KEY = 'pk_test_51S1b3QJ8qdRQM04JXjiqEJcPfqwqXPiRMhkPsMbsvUklHNMjF7VLcnlKPnMw3lsyznECv83FkdmpIB1yfcVciMCK00RDLPAUUd';

  async initialize(): Promise<void> {
    // Initialize Stripe SDK if using React Native Stripe SDK
    console.log('💳 StripePaymentService initialized');
  }

  // Create payment intent for subscription
  async createPaymentIntent(planId: string): Promise<StripePaymentIntent> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await authService.getAuthToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      const response = await fetch(`${this.API_BASE_URL}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId,
          userId: user.id,
          email: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const paymentIntent = await response.json();
      return paymentIntent;
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw error;
    }
  }

  // Process subscription purchase
  async purchaseSubscription(planId: string, paymentMethodId: string): Promise<SubscriptionPurchase> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await authService.getAuthToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      const response = await fetch(`${this.API_BASE_URL}/api/payments/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId,
          paymentMethodId,
          userId: user.id,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment failed');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local user state to premium
        await authService.upgradeToPremium();
      }

      return result;
    } catch (error) {
      console.error('Subscription purchase failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }

  // Start free trial
  async startFreeTrial(): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await authService.getAuthToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      const response = await fetch(`${this.API_BASE_URL}/api/payments/start-trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start trial');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local user state to trial
        await authService.upgradeToTrial();
      }

      return result;
    } catch (error) {
      console.error('Trial start failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start trial',
      };
    }
  }

  // Cancel subscription
  async cancelSubscription(): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await authService.getAuthToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      const response = await fetch(`${this.API_BASE_URL}/api/payments/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel subscription');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local user state
        await authService.downgradeToFree();
      }

      return result;
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
      };
    }
  }

  // Get subscription status
  async getSubscriptionStatus(): Promise<{
    status: 'active' | 'trial' | 'canceled' | 'expired' | 'free' | 'premium';
    planId?: string;
    currentPeriodEnd?: string;
    trialEnd?: string;
  }> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return { status: 'free' };
      }

      const token = await authService.getAuthToken();
      if (!token) {
        return { status: user.subscriptionStatus || 'free' };
      }

      const response = await fetch(`${this.API_BASE_URL}/api/payments/subscription-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn('Failed to fetch subscription status, falling back to local state');
        return { status: user.subscriptionStatus || 'free' };
      }

      const status = await response.json();
      return status;
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      const user = await authService.getCurrentUser();
      return { status: user?.subscriptionStatus || 'free' };
    }
  }

  // Process payment with test card
  async processTestPayment(planId: string): Promise<SubscriptionPurchase> {
    try {
      // For testing purposes, simulate successful payment
      console.log('🧪 Processing test payment for plan:', planId);
      
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await authService.getAuthToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      // Simulate API call with test card
      const response = await fetch(`${this.API_BASE_URL}/api/payments/test-purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId,
          userId: user.id,
          testCard: '4242424242424242',
        }),
      });

      if (!response.ok) {
        throw new Error('Test payment failed');
      }

      const result = await response.json();
      
      if (result.success) {
        await authService.upgradeToPremium();
      }

      return result;
    } catch (error) {
      console.error('Test payment failed:', error);
      
      // For demo purposes, simulate success after showing alert
      Alert.alert(
        'Test Payment',
        'This is a test payment. In production, this would process through Stripe.',
        [
          {
            text: 'Simulate Success',
            onPress: async () => {
              await authService.upgradeToPremium();
            },
          },
        ]
      );

      return {
        success: true,
        subscriptionId: 'test_sub_' + Date.now(),
        paymentIntentId: 'test_pi_' + Date.now(),
      };
    }
  }

  // Get pricing information
  async getPricing(): Promise<{
    monthly: { price: number; currency: string; priceId: string };
    yearly: { price: number; currency: string; priceId: string };
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/payments/pricing`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pricing');
      }

      const pricing = await response.json();
      return pricing;
    } catch (error) {
      console.error('Failed to get pricing:', error);
      // Return default pricing
      return {
        monthly: { price: 3.99, currency: 'GBP', priceId: 'price_monthly' },
        yearly: { price: 29.99, currency: 'GBP', priceId: 'price_yearly' },
      };
    }
  }

  // Restore purchases (for mobile app stores)
  async restorePurchases(): Promise<{ success: boolean; restored: boolean; error?: string }> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await authService.getAuthToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      const response = await fetch(`${this.API_BASE_URL}/api/payments/restore-purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to restore purchases');
      }

      const result = await response.json();
      
      if (result.restored) {
        await authService.upgradeToPremium();
      }

      return result;
    } catch (error) {
      console.error('Restore purchases failed:', error);
      return {
        success: false,
        restored: false,
        error: error instanceof Error ? error.message : 'Restore failed',
      };
    }
  }

  // Webhook handling (for backend integration)
  async handleWebhook(event: any): Promise<void> {
    // This would be handled on the backend
    console.log('Stripe webhook event:', event.type);
    
    switch (event.type) {
      case 'invoice.payment_succeeded':
        console.log('Payment succeeded');
        break;
      case 'customer.subscription.deleted':
        console.log('Subscription canceled');
        break;
      case 'customer.subscription.updated':
        console.log('Subscription updated');
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }
  }

  // Utility methods
  getPublishableKey(): string {
    return this.STRIPE_PUBLISHABLE_KEY;
  }

  formatPrice(amount: number, currency: string = 'GBP'): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  // Validate payment method
  validatePaymentMethod(paymentMethod: any): boolean {
    return paymentMethod && paymentMethod.id && paymentMethod.type;
  }

  // Calculate savings for yearly plan
  calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
    const yearlyAsMonthly = monthlyPrice * 12;
    return Math.max(0, yearlyAsMonthly - yearlyPrice);
  }

  // Generate payment sheet configuration
  getPaymentSheetConfig(clientSecret: string) {
    return {
      merchantDisplayName: 'iTrackHabit',
      paymentIntentClientSecret: clientSecret,
      defaultBillingDetails: {
        email: '',
      },
      allowsDelayedPaymentMethods: true,
      appearance: {
        colors: {
          primary: '#6366F1',
          background: '#FFFFFF',
          componentBackground: '#F8FAFC',
        },
      },
    };
  }
}

export const stripePaymentService = new StripePaymentService();