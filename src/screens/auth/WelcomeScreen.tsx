import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../../types/navigation';
import { theme } from '../../theme';
import {
  NeumorphButton,
  NeumorphCard,
  NeumorphismColors,
} from '../../components/neumorphism';

type WelcomeScreenProps = RootStackScreenProps<'Welcome'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <View style={[styles.container, { backgroundColor: NeumorphismColors.background }]}>
      <SafeAreaView style={styles.container}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <NeumorphCard variant="medium" colorType="whiteGlass" style={styles.logoCard} animated>
              <Ionicons name="checkmark-circle" size={64} color={theme.colors.primary} />
            </NeumorphCard>
          </View>
          
          <Text style={styles.title}>iTrackHabit</Text>
          <Text style={styles.subtitle}>
            Build lasting habits with intelligent tracking and beautiful design
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <NeumorphCard variant="subtle" colorType="whiteGlass" style={styles.featureCard} animated>
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name="time-outline" size={24} color="#4F46E5" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Smart Timers</Text>
                <Text style={styles.featureDescription}>Neumorphic timers with background tracking</Text>
              </View>
            </View>
            
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name="bar-chart-outline" size={24} color="#10B981" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Analytics</Text>
                <Text style={styles.featureDescription}>Detailed insights into your progress</Text>
              </View>
            </View>
            
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name="notifications-outline" size={24} color="#F59E0B" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Smart Notifications</Text>
                <Text style={styles.featureDescription}>AI-powered reminders and motivation</Text>
              </View>
            </View>
          </NeumorphCard>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <NeumorphButton
            title="Create Account"
            variant="primary"
            size="large"
            onPress={() => navigation.navigate('Register')}
            glassIntensity="strong"
            style={styles.primaryButton}
          />
          
          <NeumorphButton
            title="Already have an account? Sign In"
            variant="secondary"
            size="medium"
            onPress={() => navigation.navigate('Login')}
            glassIntensity="light"
            style={styles.secondaryButton}
          />
        </View>

        {/* Demo Section */}
        <View style={styles.demoSection}>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl * 2,
  },
  logoContainer: {
    marginBottom: theme.spacing.xl,
  },
  logoCard: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: theme.fontWeight.bold,
    color: '#1F2937',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: theme.spacing.md,
  },
  featuresSection: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  featureCard: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
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
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: '#1F2937',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: theme.fontSize.sm,
    color: '#6B7280',
    lineHeight: 18,
  },
  actionSection: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
  demoSection: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  demoText: {
    fontSize: theme.fontSize.sm,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  demoCredentials: {
    fontWeight: theme.fontWeight.medium,
    color: '#6B7280',
  },
});