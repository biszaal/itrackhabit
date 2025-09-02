import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { theme } from '../../theme';
import { User, SubscriptionPlan } from '../../types';
import { authService } from '../../services/auth';
import { premiumService } from '../../services/premium';
import { featureGatingService, PremiumFeature } from '../../services/premium';
import { stripePaymentService } from '../../services/premium';
import { NeumorphCard, NeumorphButton, NeumorphismColors } from '../../components/neumorphism';

type EnhancedPremiumScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Premium'>;

interface Props {
  navigation: EnhancedPremiumScreenNavigationProp;
}

export const EnhancedPremiumScreen: React.FC<Props> = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [premiumFeatures, setPremiumFeatures] = useState<PremiumFeature[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [user, plans, features] = await Promise.all([
        authService.getCurrentUser(),
        premiumService.getSubscriptionPlans(),
        featureGatingService.getPremiumFeatures(),
      ]);

      setCurrentUser(user);
      setSubscriptionPlans(plans);
      setPremiumFeatures(features);
      
      // Pre-select the recommended plan
      const recommended = premiumService.getRecommendedPlan();
      setSelectedPlan(recommended.id);

      // Get subscription status from Stripe
      if (user) {
        const status = await stripePaymentService.getSubscriptionStatus();
        setSubscriptionStatus(status);
      }
    } catch (error) {
      console.error('Error loading premium data:', error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !currentUser) return;

    setLoading(true);
    try {
      // For development, we'll use test payment
      const updatedUser = await premiumService.purchaseSubscription(selectedPlan);
      setCurrentUser(updatedUser);
      
      Alert.alert(
        'Welcome to Premium! 🎉',
        'You now have unlimited access to all features. Enjoy building better habits!',
        [
          { 
            text: 'Get Started', 
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Purchase Failed',
        error instanceof Error ? error.message : 'Unable to complete purchase. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restoredUser = await premiumService.restorePurchases();
      
      if (restoredUser) {
        setCurrentUser(restoredUser);
        Alert.alert(
          'Purchases Restored',
          'Your premium subscription has been restored!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases to restore.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        error instanceof Error ? error.message : 'Unable to restore purchases. Please try again.'
      );
    } finally {
      setRestoring(false);
    }
  };

  const handleStartTrial = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const updatedUser = await premiumService.startFreeTrial();
      setCurrentUser(updatedUser);
      
      Alert.alert(
        'Free Trial Started! 🎉',
        `Enjoy 7 days of unlimited access to all premium features!`,
        [
          { 
            text: 'Start Exploring', 
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Trial Failed',
        error instanceof Error ? error.message : 'Unable to start trial. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your premium subscription? You\'ll lose access to premium features at the end of your billing period.',
      [
        { text: 'Keep Premium', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await premiumService.cancelSubscription();
              
              if (result.success) {
                Alert.alert('Subscription Canceled', result.message);
                await loadData(); // Refresh data
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="close" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Upgrade to Premium</Text>
      <Text style={styles.headerSubtitle}>
        Unlock unlimited habits and advanced features
      </Text>
    </View>
  );

  const renderCurrentStatus = () => {
    if (!currentUser) return null;

    const isPremium = premiumService.isPremiumUser(currentUser);
    if (isPremium) {
      const daysRemaining = premiumService.getTrialDaysRemaining(currentUser);
      
      return (
        <NeumorphCard
          variant="medium"
          colorType="successGlass"
          style={styles.statusCard}
          animated
        >
          <Ionicons name="checkmark-circle" size={32} color="#27AE60" />
          <Text style={styles.statusTitle}>
            {currentUser.subscriptionStatus === 'trial' ? 'Free Trial Active' : 'Premium Active'}
          </Text>
          {currentUser.subscriptionStatus === 'trial' && (
            <Text style={styles.statusSubtitle}>
              {daysRemaining} days remaining
            </Text>
          )}
          {subscriptionStatus?.currentPeriodEnd && currentUser.subscriptionStatus === 'premium' && (
            <Text style={styles.statusSubtitle}>
              Renews {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
            </Text>
          )}
          
          {currentUser.subscriptionStatus === 'premium' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSubscription}
            >
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          )}
        </NeumorphCard>
      );
    }

    return (
      <NeumorphCard
        variant="medium"
        colorType="whiteGlass"
        style={styles.statusCard}
        animated
      >
        <Text style={styles.statusTitle}>Free Plan</Text>
        <Text style={styles.statusSubtitle}>
          {premiumService.getHabitLimitMessage(currentUser)}
        </Text>
      </NeumorphCard>
    );
  };

  const renderFeatureCategories = () => {
    const categories = ['core', 'analytics', 'social', 'customization', 'productivity'] as const;
    
    return categories.map(category => {
      const categoryFeatures = premiumFeatures.filter(f => f.category === category);
      if (categoryFeatures.length === 0) return null;
      
      const categoryNames = {
        core: 'Core Features',
        analytics: 'Analytics & Insights',
        social: 'Social Features',
        customization: 'Customization',
        productivity: 'Productivity Tools',
      };

      const categoryIcons = {
        core: 'star',
        analytics: 'analytics',
        social: 'people',
        customization: 'color-palette',
        productivity: 'flash',
      };

      return (
        <NeumorphCard
          key={category}
          variant="subtle"
          colorType="whiteGlass"
          style={styles.featureCategoryCard}
          animated
        >
          <View style={styles.categoryHeader}>
            <Ionicons name={categoryIcons[category] as any} size={24} color={theme.colors.primary} />
            <Text style={styles.categoryTitle}>{categoryNames[category]}</Text>
          </View>
          
          {categoryFeatures.map((feature, index) => (
            <View key={feature.id} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
              <View style={styles.featureContent}>
                <Text style={styles.featureName}>{feature.name}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </NeumorphCard>
      );
    });
  };

  const renderPricingPlans = () => {
    if (currentUser && premiumService.isPremiumUser(currentUser)) {
      return null; // Don't show pricing if already premium
    }

    const savings = premiumService.calculateYearlySavings();

    return (
      <NeumorphCard
        variant="medium"
        colorType="primaryGlass"
        style={styles.pricingCard}
        animated
      >
        <Text style={styles.pricingTitle}>Choose Your Plan</Text>
        
        {subscriptionPlans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlan === plan.id && styles.planCardSelected
            ]}
            onPress={() => setSelectedPlan(plan.id)}
          >
            <View style={styles.planHeader}>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.name}</Text>
                {plan.interval === 'yearly' && savings > 0 && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>Save £{savings.toFixed(0)}/year</Text>
                  </View>
                )}
              </View>
              <View style={styles.planPricing}>
                <Text style={styles.planPrice}>
                  {stripePaymentService.formatPrice(plan.price, plan.currency)}
                </Text>
                <Text style={styles.planInterval}>/{plan.interval}</Text>
              </View>
            </View>
            
            <View style={styles.radioButton}>
              {selectedPlan === plan.id && (
                <View style={styles.radioButtonSelected} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </NeumorphCard>
    );
  };

  const renderActions = () => {
    if (!currentUser) return null;

    const isPremium = premiumService.isPremiumUser(currentUser);
    const canStartTrial = currentUser.subscriptionStatus === 'free' && !(currentUser as any).hasUsedTrial;

    if (isPremium) {
      return (
        <NeumorphCard
          variant="medium"
          colorType="whiteGlass"
          style={styles.actionsCard}
          animated
        >
          <Text style={styles.thanksTitle}>Thank you for being a Premium member! 🎉</Text>
          <Text style={styles.thanksSubtitle}>
            Enjoy unlimited habits and all premium features.
          </Text>
        </NeumorphCard>
      );
    }

    return (
      <NeumorphCard
        variant="medium"
        colorType="whiteGlass"
        style={styles.actionsCard}
        animated
      >
        {canStartTrial && (
          <NeumorphButton
            title="Start 7-Day Free Trial"
            variant="secondary"
            size="large"
            onPress={handleStartTrial}
            disabled={loading}
            style={styles.trialButton}
            glassIntensity="medium"
          />
        )}
        
        <NeumorphButton
          title={canStartTrial ? 'Subscribe After Trial' : 'Subscribe Now'}
          variant="primary"
          size="large"
          onPress={handlePurchase}
          disabled={loading || !selectedPlan}
          style={styles.purchaseButton}
          glassIntensity="strong"
        />
        
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator color={theme.colors.textMuted} size="small" />
          ) : (
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>
      </NeumorphCard>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {renderHeader()}
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderCurrentStatus()}
          {renderFeatureCategories()}
          {renderPricingPlans()}
          {renderActions()}
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              💳 Secure payment powered by Stripe
            </Text>
            <Text style={styles.footerText}>
              Cancel anytime. Terms and privacy policy apply.
            </Text>
          </View>
        </ScrollView>
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <NeumorphCard
              variant="strong"
              colorType="whiteGlass"
              style={styles.loadingCard}
              animated
            >
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Processing...</Text>
            </NeumorphCard>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NeumorphismColors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing.lg,
    top: theme.spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  statusCard: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  statusSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  cancelButtonText: {
    fontSize: theme.fontSize.sm,
    color: '#E74C3C',
    fontWeight: theme.fontWeight.medium,
  },
  featureCategoryCard: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  categoryTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  featureContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  featureName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  pricingCard: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  pricingTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  planCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  planHeader: {
    flex: 1,
  },
  planInfo: {
    marginBottom: theme.spacing.sm,
  },
  planName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  savingsBadge: {
    backgroundColor: '#27AE60',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  savingsText: {
    color: 'white',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  planInterval: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  actionsCard: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  thanksTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  thanksSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  trialButton: {
    marginBottom: theme.spacing.md,
  },
  purchaseButton: {
    marginBottom: theme.spacing.md,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  restoreButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  footer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    minWidth: 150,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
});