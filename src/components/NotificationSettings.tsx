import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NeumorphCard, NeumorphButton, NeumorphismColors } from './neumorphism';
import { useNotificationSettings } from '../hooks/useSmartNotifications';
import { theme } from '../theme';

interface TimePickerModalProps {
  isVisible: boolean;
  title: string;
  initialTime: string;
  onConfirm: (time: string) => void;
  onCancel: () => void;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  isVisible,
  title,
  initialTime,
  onConfirm,
  onCancel,
}) => {
  const [hours, setHours] = useState(parseInt(initialTime.split(':')[0]));
  const [minutes, setMinutes] = useState(parseInt(initialTime.split(':')[1]));

  if (!isVisible) return null;

  const handleConfirm = () => {
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    onConfirm(timeString);
  };

  return (
    <View style={styles.modalOverlay}>
      <NeumorphCard variant="convex" size="large" style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title}</Text>
        
        <View style={styles.timePicker}>
          <View style={styles.timeColumn}>
            <Text style={styles.pickerTimeLabel}>Hours</Text>
            <ScrollView style={styles.scrollPicker} showsVerticalScrollIndicator={false}>
              {Array.from({ length: 24 }, (_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.timeOption, hours === i && styles.selectedTimeOption]}
                  onPress={() => setHours(i)}
                >
                  <Text style={[styles.pickerTimeText, hours === i && styles.selectedTimeText]}>
                    {i.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <Text style={styles.timeSeparator}>:</Text>
          
          <View style={styles.timeColumn}>
            <Text style={styles.pickerTimeLabel}>Minutes</Text>
            <ScrollView style={styles.scrollPicker} showsVerticalScrollIndicator={false}>
              {Array.from({ length: 60 }, (_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.timeOption, minutes === i && styles.selectedTimeOption]}
                  onPress={() => setMinutes(i)}
                >
                  <Text style={[styles.pickerTimeText, minutes === i && styles.selectedTimeText]}>
                    {i.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.modalButtons}>
          <NeumorphButton
            variant="secondary"
            size="medium"
            onPress={onCancel}
            style={styles.modalButton}
          >
            <Text style={styles.modalButtonText}>Cancel</Text>
          </NeumorphButton>
          
          <NeumorphButton
            variant="primary"
            size="medium"
            onPress={handleConfirm}
            style={[styles.modalButton, styles.confirmButton]}
          >
            <Text style={[styles.modalButtonText, styles.confirmButtonText]}>Confirm</Text>
          </NeumorphButton>
        </View>
      </NeumorphCard>
    </View>
  );
};

export const NotificationSettings: React.FC = () => {
  const {
    preferences,
    isLoading,
    toggleEnabled,
    toggleHabitReminders,
    toggleStreakProtection,
    toggleMotivationalMessages,
    updateQuietHours,
    updateFrequency,
  } = useNotificationSettings();

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  if (!preferences) {
    return (
      <NeumorphCard variant="convex" size="large" style={styles.loadingCard}>
        <Text style={styles.loadingText}>Loading notification preferences...</Text>
      </NeumorphCard>
    );
  }

  const handleToggleQuietHours = () => {
    updateQuietHours({
      ...preferences.quietHours,
      enabled: !preferences.quietHours.enabled,
    });
  };

  const handleStartTimeChange = (time: string) => {
    updateQuietHours({
      ...preferences.quietHours,
      start: time,
    });
    setShowStartTimePicker(false);
  };

  const handleEndTimeChange = (time: string) => {
    updateQuietHours({
      ...preferences.quietHours,
      end: time,
    });
    setShowEndTimePicker(false);
  };

  const frequencyOptions = [
    { key: 'minimal', label: 'Minimal', description: 'Only essential reminders' },
    { key: 'balanced', label: 'Balanced', description: 'Helpful reminders with motivation' },
    { key: 'frequent', label: 'Frequent', description: 'All notifications and encouragement' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Master Toggle */}
      <NeumorphCard variant="convex" size="medium" style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={24} color={theme.colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Smart Notifications</Text>
              <Text style={styles.settingDescription}>
                Enable intelligent habit reminders
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.enabled}
            onValueChange={toggleEnabled}
            disabled={isLoading}
            trackColor={{
              false: NeumorphismColors.lightShadow,
              true: theme.colors.primary + '40',
            }}
            thumbColor={preferences.enabled ? theme.colors.primary : NeumorphismColors.darkShadow}
          />
        </View>
      </NeumorphCard>

      {preferences.enabled && (
        <>
          {/* Notification Types */}
          <NeumorphCard variant="convex" size="medium" style={styles.card}>
            <Text style={styles.sectionTitle}>Notification Types</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="alarm" size={20} color={theme.colors.text} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Habit Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Daily reminders for your habits
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.habitReminders}
                onValueChange={toggleHabitReminders}
                disabled={isLoading}
                trackColor={{
                  false: NeumorphismColors.lightShadow,
                  true: theme.colors.primary + '40',
                }}
                thumbColor={preferences.habitReminders ? theme.colors.primary : NeumorphismColors.darkShadow}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="flame" size={20} color={theme.colors.warning} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Streak Protection</Text>
                  <Text style={styles.settingDescription}>
                    Alerts when your streaks are at risk
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.streakProtection}
                onValueChange={toggleStreakProtection}
                disabled={isLoading}
                trackColor={{
                  false: NeumorphismColors.lightShadow,
                  true: theme.colors.warning + '40',
                }}
                thumbColor={preferences.streakProtection ? theme.colors.warning : NeumorphismColors.darkShadow}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="happy" size={20} color={theme.colors.success} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Motivational Messages</Text>
                  <Text style={styles.settingDescription}>
                    Encouraging messages based on your progress
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.motivationalMessages}
                onValueChange={toggleMotivationalMessages}
                disabled={isLoading}
                trackColor={{
                  false: NeumorphismColors.lightShadow,
                  true: theme.colors.success + '40',
                }}
                thumbColor={preferences.motivationalMessages ? theme.colors.success : NeumorphismColors.darkShadow}
              />
            </View>
          </NeumorphCard>

          {/* Frequency Settings */}
          <NeumorphCard variant="convex" size="medium" style={styles.card}>
            <Text style={styles.sectionTitle}>Frequency</Text>
            
            {frequencyOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.frequencyOption}
                onPress={() => updateFrequency(option.key as 'minimal' | 'balanced' | 'frequent')}
                disabled={isLoading}
              >
                <View style={styles.radioOption}>
                  <View style={[
                    styles.radioButton,
                    preferences.frequency === option.key && styles.radioButtonSelected
                  ]}>
                    {preferences.frequency === option.key && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <View style={styles.frequencyText}>
                    <Text style={styles.frequencyLabel}>{option.label}</Text>
                    <Text style={styles.frequencyDescription}>{option.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </NeumorphCard>

          {/* Quiet Hours */}
          <NeumorphCard variant="convex" size="medium" style={styles.card}>
            <Text style={styles.sectionTitle}>Quiet Hours</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon" size={20} color={theme.colors.text} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Enable Quiet Hours</Text>
                  <Text style={styles.settingDescription}>
                    No notifications during these hours
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.quietHours.enabled}
                onValueChange={handleToggleQuietHours}
                disabled={isLoading}
                trackColor={{
                  false: NeumorphismColors.lightShadow,
                  true: theme.colors.primary + '40',
                }}
                thumbColor={preferences.quietHours.enabled ? theme.colors.primary : NeumorphismColors.darkShadow}
              />
            </View>

            {preferences.quietHours.enabled && (
              <View style={styles.timeSettings}>
                <TouchableOpacity
                  style={styles.timeSetting}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={styles.timeLabel}>Start Time</Text>
                  <View style={styles.timeValue}>
                    <Text style={styles.timeText}>{preferences.quietHours.start}</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.timeSetting}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text style={styles.timeLabel}>End Time</Text>
                  <View style={styles.timeValue}>
                    <Text style={styles.timeText}>{preferences.quietHours.end}</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </NeumorphCard>
        </>
      )}

      <TimePickerModal
        isVisible={showStartTimePicker}
        title="Quiet Hours Start Time"
        initialTime={preferences.quietHours.start}
        onConfirm={handleStartTimeChange}
        onCancel={() => setShowStartTimePicker(false)}
      />

      <TimePickerModal
        isVisible={showEndTimePicker}
        title="Quiet Hours End Time"
        initialTime={preferences.quietHours.end}
        onConfirm={handleEndTimeChange}
        onCancel={() => setShowEndTimePicker(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  loadingCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    margin: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
  card: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  frequencyOption: {
    marginBottom: theme.spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  frequencyText: {
    marginLeft: theme.spacing.md,
  },
  frequencyLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  frequencyDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  timeSettings: {
    marginTop: theme.spacing.md,
  },
  timeSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  timeLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  timeValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '80%',
    maxWidth: 320,
    padding: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  timeColumn: {
    alignItems: 'center',
    flex: 1,
  },
  pickerTimeLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  scrollPicker: {
    height: 120,
    width: 60,
  },
  timeOption: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  selectedTimeOption: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.sm,
  },
  pickerTimeText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  selectedTimeText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  timeSeparator: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
    marginHorizontal: theme.spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary + '10',
  },
  modalButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    textAlign: 'center',
  },
  confirmButtonText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
});

export default NotificationSettings;