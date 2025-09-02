import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { theme } from '../../theme';
import { NeumorphCard, NeumorphButton } from '../../components/neumorphism';
import { useAuth } from '../../contexts/AuthContext';

interface PrivacySettings {
  biometricAuth: boolean;
  dataCollection: boolean;
  analyticsOptOut: boolean;
  shareUsageData: boolean;
  friendsCanSeeProgress: boolean;
  showInLeaderboards: boolean;
  allowNotifications: boolean;
  autoLockTimeout: number; // in minutes
}

export const PrivacySecurity: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>({
    biometricAuth: false,
    dataCollection: true,
    analyticsOptOut: false,
    shareUsageData: false,
    friendsCanSeeProgress: true,
    showInLeaderboards: true,
    allowNotifications: true,
    autoLockTimeout: 15,
  });
  const [loading, setLoading] = useState(true);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  useEffect(() => {
    loadSettings();
    checkBiometricSupport();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('privacySettings');
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: PrivacySettings) => {
    try {
      await AsyncStorage.setItem('privacySettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      setBiometricSupported(compatible && enrolled);
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Touch ID');
      } else {
        setBiometricType('Biometric');
      }
    } catch (error) {
      console.error('Error checking biometric support:', error);
    }
  };

  const updateSetting = (key: keyof PrivacySettings, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value && biometricSupported) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Enable biometric authentication for iTrackHabit',
          fallbackLabel: 'Use passcode',
        });
        
        if (result.success) {
          updateSetting('biometricAuth', true);
        }
      } catch (error) {
        console.error('Biometric authentication failed:', error);
        Alert.alert('Error', 'Biometric authentication failed. Please try again.');
      }
    } else {
      updateSetting('biometricAuth', false);
    }
  };

  const clearAccountData = () => {
    Alert.alert(
      'Clear Account Data',
      'This will remove all your personal data from this device, but your account will remain active. You can sign in again to restore your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              await logout();
              Alert.alert('Success', 'Account data has been cleared from this device.');
            } catch (error) {
              console.error('Error clearing account data:', error);
              Alert.alert('Error', 'Failed to clear account data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Warning',
              'Are you absolutely sure? This will permanently delete your account and all data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: () => {
                    // Account deletion functionality
                    Alert.alert('Account Deletion', 'Account deletion will be available in a future update.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const viewPrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Our privacy policy explains how we collect, use, and protect your personal information.\n\n' +
      'Key points:\n' +
      '• We only collect data necessary for app functionality\n' +
      '• Your habit data is stored locally on your device\n' +
      '• We never sell your personal information\n' +
      '• You can delete your data at any time\n\n' +
      'For the complete privacy policy, visit our website.',
      [{ text: 'OK' }]
    );
  };

  const viewTermsOfService = () => {
    Alert.alert(
      'Terms of Service',
      'Our terms of service outline the rules and guidelines for using iTrackHabit.\n\n' +
      'By using this app, you agree to:\n' +
      '• Use the app responsibly\n' +
      '• Not misuse or abuse the service\n' +
      '• Respect other users\n' +
      '• Follow applicable laws\n\n' +
      'For the complete terms of service, visit our website.',
      [{ text: 'OK' }]
    );
  };

  const SettingRow: React.FC<{
    title: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon: string;
    disabled?: boolean;
  }> = ({ title, description, value, onValueChange, icon, disabled = false }) => (
    <NeumorphCard
      variant="light"
      colorType="whiteGlass"
      style={[styles.settingRow, disabled && styles.settingRowDisabled]}
      animated={true}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIconContainer}>
          <Ionicons 
            name={icon as any} 
            size={22} 
            color={disabled ? theme.colors.textMuted : theme.colors.primary} 
          />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, disabled && styles.settingTitleDisabled]}>
            {title}
          </Text>
          {description && (
            <Text style={[styles.settingDescription, disabled && styles.settingDescriptionDisabled]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: theme.colors.borderSoft, true: theme.colors.primarySoft }}
        thumbColor={value ? theme.colors.primary : theme.colors.textMuted}
        ios_backgroundColor={theme.colors.borderSoft}
      />
    </NeumorphCard>
  );

  const ActionButton: React.FC<{
    title: string;
    description: string;
    icon: string;
    onPress: () => void;
    variant?: 'default' | 'danger';
  }> = ({ title, description, icon, onPress, variant = 'default' }) => (
    <TouchableOpacity onPress={onPress}>
      <NeumorphCard
        variant="light"
        colorType="whiteGlass"
        style={styles.actionButton}
        animated={true}
      >
        <View style={styles.actionButtonContent}>
          <View style={[
            styles.actionButtonIcon,
            { backgroundColor: (variant === 'danger' ? theme.colors.error : theme.colors.primary) + '20' }
          ]}>
            <Ionicons 
              name={icon as any} 
              size={22} 
              color={variant === 'danger' ? theme.colors.error : theme.colors.primary} 
            />
          </View>
          <View style={styles.actionButtonTextContainer}>
            <Text style={[
              styles.actionButtonTitle,
              variant === 'danger' && { color: theme.colors.error }
            ]}>
              {title}
            </Text>
            <Text style={styles.actionButtonDescription}>{description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
        </View>
      </NeumorphCard>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading settings...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <NeumorphCard
          variant="light"
          colorType="whiteGlass"
          style={styles.header}
          animated={true}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Privacy & Security</Text>
          </View>
        </NeumorphCard>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Security Settings */}
          <NeumorphCard
            variant="medium"
            colorType="whiteGlass"
            style={styles.sectionCard}
            animated={true}
          >
            <Text style={styles.sectionTitle}>Security</Text>
            
            <SettingRow
              title={`${biometricType} Authentication`}
              description={biometricSupported ? 
                `Use ${biometricType} to unlock the app` : 
                `${biometricType} not available on this device`}
              value={settings.biometricAuth}
              onValueChange={handleBiometricToggle}
              icon="finger-print-outline"
              disabled={!biometricSupported}
            />
          </NeumorphCard>

          {/* Privacy Settings */}
          <NeumorphCard
            variant="medium"
            colorType="whiteGlass"
            style={styles.sectionCard}
            animated={true}
          >
            <Text style={styles.sectionTitle}>Privacy</Text>
            
            <SettingRow
              title="Data Collection"
              description="Allow collection of usage data to improve the app"
              value={settings.dataCollection}
              onValueChange={(value) => updateSetting('dataCollection', value)}
              icon="analytics-outline"
            />
            
            <SettingRow
              title="Analytics Opt-out"
              description="Opt out of anonymous analytics data collection"
              value={settings.analyticsOptOut}
              onValueChange={(value) => updateSetting('analyticsOptOut', value)}
              icon="eye-off-outline"
            />
            
            <SettingRow
              title="Share Usage Data"
              description="Help improve the app by sharing anonymous usage data"
              value={settings.shareUsageData}
              onValueChange={(value) => updateSetting('shareUsageData', value)}
              icon="share-outline"
            />
          </NeumorphCard>

          {/* Social Privacy */}
          <NeumorphCard
            variant="medium"
            colorType="whiteGlass"
            style={styles.sectionCard}
            animated={true}
          >
            <Text style={styles.sectionTitle}>Social Privacy</Text>
            
            <SettingRow
              title="Friends Can See Progress"
              description="Allow friends to view your habit progress"
              value={settings.friendsCanSeeProgress}
              onValueChange={(value) => updateSetting('friendsCanSeeProgress', value)}
              icon="people-outline"
            />
            
            <SettingRow
              title="Show in Leaderboards"
              description="Display your progress in public leaderboards"
              value={settings.showInLeaderboards}
              onValueChange={(value) => updateSetting('showInLeaderboards', value)}
              icon="trophy-outline"
            />
          </NeumorphCard>

          {/* Legal & Policy */}
          <NeumorphCard
            variant="medium"
            colorType="whiteGlass"
            style={styles.sectionCard}
            animated={true}
          >
            <Text style={styles.sectionTitle}>Legal & Policy</Text>
            
            <ActionButton
              title="Privacy Policy"
              description="Read our privacy policy"
              icon="document-text-outline"
              onPress={viewPrivacyPolicy}
            />
            
            <ActionButton
              title="Terms of Service"
              description="View terms and conditions"
              icon="document-outline"
              onPress={viewTermsOfService}
            />
          </NeumorphCard>

          {/* Account Management */}
          {user && (
            <NeumorphCard
              variant="medium"
              colorType="whiteGlass"
              style={styles.sectionCard}
              animated={true}
            >
              <Text style={styles.sectionTitle}>Account Management</Text>
              
              <ActionButton
                title="Clear Account Data"
                description="Remove all data from this device"
                icon="refresh-outline"
                onPress={clearAccountData}
              />
              
              <ActionButton
                title="Delete Account"
                description="Permanently delete your account and all data"
                icon="trash-outline"
                onPress={deleteAccount}
                variant="danger"
              />
            </NeumorphCard>
          )}

          {/* Security Tips */}
          <NeumorphCard
            variant="light"
            colorType="successGlass"
            style={styles.tipsCard}
            animated={true}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.success} />
              <Text style={styles.sectionTitle}>Security Tips</Text>
            </View>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>
                🔒 Enable biometric authentication for better security
              </Text>
              <Text style={styles.tipItem}>
                🔄 Regularly review your privacy settings
              </Text>
              <Text style={styles.tipItem}>
                📱 Keep your app updated for the latest security features
              </Text>
              <Text style={styles.tipItem}>
                🛡️ Use strong passwords for your account
              </Text>
            </View>
          </NeumorphCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  sectionCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  tipsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  settingTitleDisabled: {
    color: theme.colors.textMuted,
  },
  settingDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  settingDescriptionDisabled: {
    color: theme.colors.textMuted,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    padding: 0,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  actionButtonTextContainer: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  actionButtonDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  tipsList: {
    gap: theme.spacing.sm,
  },
  tipItem: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
});