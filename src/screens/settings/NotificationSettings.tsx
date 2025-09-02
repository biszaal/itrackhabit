import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { theme } from '../../theme';
import { NeumorphCard, NeumorphButton } from '../../components/neumorphism';

interface NotificationSettingsState {
  pushNotifications: boolean;
  habitReminders: boolean;
  dailySummary: boolean;
  weeklyReports: boolean;
  achievementAlerts: boolean;
  challengeUpdates: boolean;
  reminderTime: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const NotificationSettings: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [settings, setSettings] = useState<NotificationSettingsState>({
    pushNotifications: true,
    habitReminders: true,
    dailySummary: true,
    weeklyReports: false,
    achievementAlerts: true,
    challengeUpdates: false,
    reminderTime: '09:00',
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    soundEnabled: true,
    vibrationEnabled: true,
  });
  
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    checkNotificationPermissions();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettingsState) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // Schedule notifications based on new settings
      if (newSettings.habitReminders) {
        scheduleHabitReminders();
      }
      
      if (newSettings.dailySummary) {
        scheduleDailySummary();
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const checkNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  };

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in your device settings to receive habit reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => console.log('Open settings not available') }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  };

  const scheduleHabitReminders = async () => {
    try {
      // Cancel existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      if (!settings.habitReminders) return;
      
      // Schedule daily habit reminder
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Time for your habits!',
          body: 'Check in with your daily routines and keep your streak going.',
          sound: settings.soundEnabled,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR as any,
          hour: parseInt(settings.reminderTime.split(':')[0]),
          minute: parseInt(settings.reminderTime.split(':')[1]),
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  };

  const scheduleDailySummary = async () => {
    try {
      if (!settings.dailySummary) return;
      
      // Schedule daily summary at 8 PM
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Daily Summary',
          body: 'See how you did today and plan for tomorrow!',
          sound: settings.soundEnabled,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR as any,
          hour: 20,
          minute: 0,
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Error scheduling daily summary:', error);
    }
  };

  const updateSetting = (key: keyof NotificationSettingsState, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const testNotification = async () => {
    try {
      if (permissionStatus !== 'granted') {
        await requestNotificationPermissions();
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'This is a test notification from iTrackHabit!',
          sound: settings.soundEnabled,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL as any, seconds: 1 },
      });
      
      Alert.alert('Success', 'Test notification scheduled!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  const SettingRow: React.FC<{
    title: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon: string;
  }> = ({ title, description, value, onValueChange, icon }) => (
    <NeumorphCard
      variant="light"
      colorType="whiteGlass"
      style={styles.settingRow}
      animated={true}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIconContainer}>
          <Ionicons name={icon as any} size={22} color={theme.colors.primary} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.borderSoft, true: theme.colors.primarySoft }}
        thumbColor={value ? theme.colors.primary : theme.colors.textMuted}
        ios_backgroundColor={theme.colors.borderSoft}
      />
    </NeumorphCard>
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
            <Text style={styles.headerTitle}>Notification Settings</Text>
          </View>
        </NeumorphCard>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Permission Status */}
          <NeumorphCard
            variant="medium"
            colorType={permissionStatus === 'granted' ? 'successGlass' : 'errorGlass'}
            style={styles.permissionCard}
            animated={true}
          >
            <View style={styles.permissionContent}>
              <Ionicons 
                name={permissionStatus === 'granted' ? 'checkmark-circle' : 'alert-circle'} 
                size={24} 
                color={permissionStatus === 'granted' ? theme.colors.success : theme.colors.error}
              />
              <View style={styles.permissionTextContainer}>
                <Text style={styles.permissionTitle}>
                  Notifications {permissionStatus === 'granted' ? 'Enabled' : 'Disabled'}
                </Text>
                <Text style={styles.permissionDescription}>
                  {permissionStatus === 'granted' 
                    ? 'You will receive habit reminders and updates.' 
                    : 'Enable notifications to receive habit reminders.'}
                </Text>
              </View>
              {permissionStatus !== 'granted' && (
                <NeumorphButton
                  title="Enable"
                  variant="primary"
                  size="small"
                  onPress={requestNotificationPermissions}
                />
              )}
            </View>
          </NeumorphCard>

          {/* Main Notifications */}
          <NeumorphCard
            variant="medium"
            colorType="whiteGlass"
            style={styles.sectionCard}
            animated={true}
          >
            <Text style={styles.sectionTitle}>Main Notifications</Text>
            
            <SettingRow
              title="Push Notifications"
              description="Receive all notifications"
              value={settings.pushNotifications}
              onValueChange={(value) => updateSetting('pushNotifications', value)}
              icon="notifications-outline"
            />
            
            <SettingRow
              title="Habit Reminders"
              description="Daily reminders for your habits"
              value={settings.habitReminders}
              onValueChange={(value) => updateSetting('habitReminders', value)}
              icon="alarm-outline"
            />
            
            <SettingRow
              title="Daily Summary"
              description="Evening summary of your progress"
              value={settings.dailySummary}
              onValueChange={(value) => updateSetting('dailySummary', value)}
              icon="today-outline"
            />
            
            <SettingRow
              title="Weekly Reports"
              description="Weekly progress reports"
              value={settings.weeklyReports}
              onValueChange={(value) => updateSetting('weeklyReports', value)}
              icon="calendar-outline"
            />
          </NeumorphCard>

          {/* Achievement Notifications */}
          <NeumorphCard
            variant="medium"
            colorType="whiteGlass"
            style={styles.sectionCard}
            animated={true}
          >
            <Text style={styles.sectionTitle}>Achievements</Text>
            
            <SettingRow
              title="Achievement Alerts"
              description="Badges and milestone celebrations"
              value={settings.achievementAlerts}
              onValueChange={(value) => updateSetting('achievementAlerts', value)}
              icon="trophy-outline"
            />
            
            <SettingRow
              title="Challenge Updates"
              description="Friend challenges and competitions"
              value={settings.challengeUpdates}
              onValueChange={(value) => updateSetting('challengeUpdates', value)}
              icon="people-outline"
            />
          </NeumorphCard>

          {/* Sound & Vibration */}
          <NeumorphCard
            variant="medium"
            colorType="whiteGlass"
            style={styles.sectionCard}
            animated={true}
          >
            <Text style={styles.sectionTitle}>Sound & Vibration</Text>
            
            <SettingRow
              title="Sound"
              description="Play sound with notifications"
              value={settings.soundEnabled}
              onValueChange={(value) => updateSetting('soundEnabled', value)}
              icon="volume-high-outline"
            />
            
            <SettingRow
              title="Vibration"
              description="Vibrate on notifications"
              value={settings.vibrationEnabled}
              onValueChange={(value) => updateSetting('vibrationEnabled', value)}
              icon="phone-portrait-outline"
            />
          </NeumorphCard>

          {/* Test Notification */}
          <NeumorphButton
            title="Send Test Notification"
            variant="secondary"
            size="large"
            onPress={testNotification}
            style={styles.testButton}
          />
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
  permissionCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  permissionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  permissionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  permissionDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  sectionCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
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
  settingDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  testButton: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
});