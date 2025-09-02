import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
// import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../theme/index';
import { NeumorphCard, NeumorphButton } from '../../components/neumorphism';
import { enhancedNotificationService } from '../../services/notifications';
// Note: HabitReminderSettings type not found
import { dataService } from '../../services/core';

interface HabitNotificationSettingsScreenProps {
  route: {
    params: {
      habitId: string;
    };
  };
}

const HabitNotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { habitId } = route.params as { habitId: string };
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [habit, setHabit] = useState<any>(null);
  const [settings, setSettings] = useState<any | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);
  const [notificationStats, setNotificationStats] = useState<any>(null);

  useEffect(() => {
    loadHabitAndSettings();
  }, [habitId]);

  const loadHabitAndSettings = async () => {
    try {
      setLoading(true);
      await dataService.initialize();
      
      const habitData = await dataService.getHabitById(habitId);
      const reminderSettings = await enhancedNotificationService.getHabitReminderSettings(habitId);
      const stats = await enhancedNotificationService.getNotificationStats(habitId);
      
      setHabit(habitData);
      setSettings(reminderSettings);
      setNotificationStats(stats);
    } catch (error) {
      console.error('Failed to load habit settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      await enhancedNotificationService.saveHabitReminderSettings(settings);
      Alert.alert('Success', 'Notification settings saved successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: any) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
  };

  const addReminderTime = () => {
    if (!settings) return;
    
    if (settings.reminderTimes.length >= 4) {
      Alert.alert('Limit Reached', 'You can have up to 4 reminder times per habit');
      return;
    }
    
    const newTime = '09:00';
    updateSettings({
      reminderTimes: [...settings.reminderTimes, newTime]
    });
  };

  const removeReminderTime = (index: number) => {
    if (!settings) return;
    
    const newTimes = settings.reminderTimes.filter((_: any, i: number) => i !== index);
    updateSettings({ reminderTimes: newTimes });
  };

  const updateReminderTime = (index: number, time: string) => {
    if (!settings) return;
    
    const newTimes = [...settings.reminderTimes];
    newTimes[index] = time;
    updateSettings({ reminderTimes: newTimes });
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    
    if (selectedDate && settings) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      updateReminderTime(selectedTimeIndex, timeString);
    }
  };

  const openTimePicker = (index: number) => {
    setSelectedTimeIndex(index);
    setShowTimePicker(true);
  };

  const getTimeFromString = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const renderReminderTimes = () => {
    if (!settings) return null;

    return (
      <NeumorphCard variant="convex" style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reminder Times</Text>
          <TouchableOpacity onPress={addReminderTime} style={styles.addButton}>
            <Ionicons name="add" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        
        {settings.reminderTimes.map((time: any, index: number) => (
          <View key={index} style={styles.timeRow}>
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => openTimePicker(index)}
            >
              <Text style={styles.timeText}>{time}</Text>
              <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            {settings.reminderTimes.length > 1 && (
              <TouchableOpacity 
                onPress={() => removeReminderTime(index)}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        <Text style={styles.helperText}>
          Set up to 4 reminder times for this habit
        </Text>
      </NeumorphCard>
    );
  };

  const renderSettings = () => {
    if (!settings) return null;

    return (
      <>
        {/* Main Toggle */}
        <NeumorphCard variant="convex" style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Reminders</Text>
              <Text style={styles.settingDescription}>
                Send notifications for this habit
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => updateSettings({ enabled: value })}
              thumbColor={settings.enabled ? theme.colors.primary : theme.colors.textSecondary}
              trackColor={{
                false: theme.colors.backgroundSecondary,
                true: theme.colors.primaryLight
              }}
            />
          </View>
        </NeumorphCard>

        {settings.enabled && (
          <>
            {renderReminderTimes()}

            {/* Smart Features */}
            <NeumorphCard variant="convex" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Smart Features</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Smart Timing</Text>
                  <Text style={styles.settingDescription}>
                    Use AI to optimize reminder times based on your activity
                  </Text>
                </View>
                <Switch
                  value={settings.smartTiming}
                  onValueChange={(value) => updateSettings({ smartTiming: value })}
                  thumbColor={settings.smartTiming ? theme.colors.primary : theme.colors.textSecondary}
                  trackColor={{
                    false: theme.colors.backgroundSecondary,
                    true: theme.colors.primaryLight
                  }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Streak Protection</Text>
                  <Text style={styles.settingDescription}>
                    Get late-day reminders to protect your streak
                  </Text>
                </View>
                <Switch
                  value={settings.streakProtection}
                  onValueChange={(value) => updateSettings({ streakProtection: value })}
                  thumbColor={settings.streakProtection ? theme.colors.primary : theme.colors.textSecondary}
                  trackColor={{
                    false: theme.colors.backgroundSecondary,
                    true: theme.colors.primaryLight
                  }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Weekdays Only</Text>
                  <Text style={styles.settingDescription}>
                    Skip reminders on weekends
                  </Text>
                </View>
                <Switch
                  value={settings.weekdaysOnly}
                  onValueChange={(value) => updateSettings({ weekdaysOnly: value })}
                  thumbColor={settings.weekdaysOnly ? theme.colors.primary : theme.colors.textSecondary}
                  trackColor={{
                    false: theme.colors.backgroundSecondary,
                    true: theme.colors.primaryLight
                  }}
                />
              </View>
            </NeumorphCard>

            {/* Motivational Style */}
            <NeumorphCard variant="convex" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Motivational Style</Text>
              
              {['gentle', 'encouraging', 'challenging'].map((style) => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.styleOption,
                    settings.motivationalStyle === style && styles.styleOptionSelected
                  ]}
                  onPress={() => updateSettings({ motivationalStyle: style as any })}
                >
                  <View style={styles.styleInfo}>
                    <Text style={styles.styleTitle}>
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </Text>
                    <Text style={styles.styleDescription}>
                      {style === 'gentle' && 'Soft, caring reminders without pressure'}
                      {style === 'encouraging' && 'Positive, motivating messages'}
                      {style === 'challenging' && 'Direct, results-focused reminders'}
                    </Text>
                  </View>
                  {settings.motivationalStyle === style && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                  )}
                </TouchableOpacity>
              ))}
            </NeumorphCard>

            {/* Statistics */}
            {notificationStats && notificationStats.totalSent > 0 && (
              <NeumorphCard variant="convex" style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Notification Insights</Text>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{notificationStats.totalSent}</Text>
                    <Text style={styles.statLabel}>Sent</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{Math.round(notificationStats.responseRate)}%</Text>
                    <Text style={styles.statLabel}>Response Rate</Text>
                  </View>
                </View>
                
                {notificationStats.bestTimes.length > 0 && (
                  <View style={styles.bestTimesContainer}>
                    <Text style={styles.bestTimesTitle}>Your best response times:</Text>
                    <View style={styles.bestTimesList}>
                      {notificationStats.bestTimes.slice(0, 3).map((hour: number, index: number) => (
                        <View key={index} style={styles.bestTimeChip}>
                          <Text style={styles.bestTimeText}>
                            {hour.toString().padStart(2, '0')}:00
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </NeumorphCard>
            )}
          </>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading notification settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {habit && (
          <View style={styles.habitInfo}>
            <Text style={styles.habitEmoji}>{habit.emoji || '⏰'}</Text>
            <Text style={styles.habitTitle}>{habit.title}</Text>
            <Text style={styles.habitSubtitle}>Customize your reminders</Text>
          </View>
        )}
        
        {renderSettings()}
      </ScrollView>
      
      <View style={styles.footer}>
        <NeumorphButton
          title={saving ? 'Saving...' : 'Save Settings'}
          onPress={saveSettings}
          disabled={saving || !settings}
          style={styles.saveButton}
        />
      </View>

      {/* showTimePicker && settings && (
        <DateTimePicker
          value={getTimeFromString(settings.reminderTimes[selectedTimeIndex])}
          mode="time"
          is24Hour={true}
          onChange={onTimeChange}
        />
      */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
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
  habitInfo: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  habitEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  habitTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  habitSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  addButton: {
    padding: theme.spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
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
    lineHeight: 18,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
  },
  timeText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  removeButton: {
    marginLeft: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  helperText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  styleOptionSelected: {
    backgroundColor: theme.colors.primaryLight,
  },
  styleInfo: {
    flex: 1,
  },
  styleTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  styleDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  bestTimesContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  bestTimesTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  bestTimesList: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  bestTimeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.full,
  },
  bestTimeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    width: '100%',
  },
});

export default HabitNotificationSettingsScreen;