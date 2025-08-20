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
import { RootStackParamList } from '../types/navigation';
import { theme } from '../theme';
import { User, SubscriptionPlan } from '../types';
import { authService } from '../services/AuthService';
import { premiumService } from '../services/PremiumService';

type PremiumScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Premium'>;

interface Props {
  navigation: PremiumScreenNavigationProp;
}

export const PremiumScreen: React.FC<Props> = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      
      const plans = premiumService.getSubscriptionPlans();
      setSubscriptionPlans(plans);
      
      // Pre-select the recommended plan
      const recommended = premiumService.getRecommendedPlan();
      setSelectedPlan(recommended.id);
    } catch (error) {
      console.error('Error loading premium data:', error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !currentUser) return;

    setLoading(true);
    try {
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
        <View style={styles.statusCard}>
          <Ionicons name="checkmark-circle" size={32} color={theme.colors.lightGreen} />
          <Text style={styles.statusTitle}>
            {currentUser.subscriptionStatus === 'trial' ? 'Free Trial Active' : 'Premium Active'}
          </Text>
          {currentUser.subscriptionStatus === 'trial' && (
            <Text style={styles.statusSubtitle}>
              {daysRemaining} days remaining
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Free Plan</Text>
        <Text style={styles.statusSubtitle}>
          {premiumService.getHabitLimitMessage(currentUser)}
        </Text>
      </View>
    );
  };

  const renderFeatures = () => {
    const features = subscriptionPlans[0]?.features || [];
    
    return (
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Premium Features</Text>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.lightGreen} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPricingPlans = () => {
    if (currentUser && premiumService.isPremiumUser(currentUser)) {
      return null; // Don't show pricing if already premium
    }

    const savings = premiumService.calculateYearlySavings();

    return (
      <View style={styles.pricingSection}>
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
        
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
                  <Text style={styles.savingsBadge}>Save ${savings.toFixed(0)}/year</Text>
                )}
              </View>
              <View style={styles.planPricing}>
                <Text style={styles.planPrice}>${plan.price}</Text>
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
      </View>
    );
  };

  const renderActions = () => {
    if (!currentUser) return null;

    const isPremium = premiumService.isPremiumUser(currentUser);
    const canStartTrial = currentUser.subscriptionStatus === 'free';

    return (
      <View style={styles.actionsSection}>
        {!isPremium && (
          <>
            {canStartTrial && (
              <TouchableOpacity
                style={styles.trialButton}
                onPress={handleStartTrial}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : (
                  <Text style={styles.trialButtonText}>Start 7-Day Free Trial</Text>
                )}
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.purchaseButton, loading && styles.buttonDisabled]}
              onPress={handlePurchase}
              disabled={loading || !selectedPlan}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.purchaseButtonText}>
                  {canStartTrial ? 'Subscribe After Trial' : 'Subscribe Now'}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
        
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator color={theme.colors.textMuted} />
          ) : (
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderCurrentStatus()}
        {renderFeatures()}
        {renderPricingPlans()}
        {renderActions()}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Cancel anytime. Terms and privacy policy apply.
          </Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing.lg,
    top: theme.spacing.md,
    padding: theme.spacing.sm,
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
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.subtle,
  },
  statusTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  statusSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  featuresSection: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  featureText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  pricingSection: {
    padding: theme.spacing.lg,
  },
  planCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  planHeader: {
    flex: 1,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  planName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  savingsBadge: {
    backgroundColor: theme.colors.lightGreen,
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
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
    borderColor: theme.colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  actionsSection: {
    padding: theme.spacing.lg,
  },
  trialButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  trialButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  purchaseButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  restoreButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
  footer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});