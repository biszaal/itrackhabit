import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button } from '../../components/ds';

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

const DEFAULTS: NotificationSettingsState = {
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
};

const Row: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  isLast?: boolean;
  disabled?: boolean;
}> = ({ icon, title, detail, value, onValueChange, isLast, disabled }) => {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: t.colors.lineSoft,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: t.colors.bgPaper, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={16} color={t.colors.ink2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }}>{title}</Text>
        {detail && <Text style={{ color: t.colors.ink3, fontSize: 12, marginTop: 2 }}>{detail}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: t.colors.primary, false: t.colors.line }}
        disabled={disabled}
      />
    </View>
  );
};

export const NotificationSettings: React.FC<{ navigation: any }> = ({ navigation }) => {
  const t = useTheme();
  const [s, setS] = useState<NotificationSettingsState>(DEFAULTS);
  const [permission, setPermission] = useState<string>('unknown');

  const load = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('notificationSettings');
      if (saved) setS({ ...DEFAULTS, ...JSON.parse(saved) });
    } catch {}
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermission(status);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = (next: NotificationSettingsState) => {
    setS(next);
    AsyncStorage.setItem('notificationSettings', JSON.stringify(next)).catch(() => {});
  };

  const requestPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermission(status);
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Enable notifications in your device settings to receive reminders.');
      }
    } catch {}
  };

  const sendTest = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Test notification', body: 'Notifications are working.' },
        trigger: { seconds: 1 } as any,
      });
    } catch {
      Alert.alert('Could not send', 'Try again.');
    }
  };

  const isEnabled = permission === 'granted' && s.pushNotifications;

  return (
    <Screen>
      <AppHeader title="Notifications" back onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 60 }}>
        {permission !== 'granted' && (
          <Card variant="flat" padding={16} style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.colors.bgPaper, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="notifications-off-outline" size={18} color={t.colors.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }}>Notifications off</Text>
              <Text style={{ color: t.colors.ink3, fontSize: 12 }}>Enable to receive habit reminders.</Text>
            </View>
            <Button title="Enable" size="sm" onPress={requestPermission} />
          </Card>
        )}

        <Text style={lblStyle(t)}>General</Text>
        <Card variant="elevated" padding={0}>
          <Row
            icon="notifications-outline"
            title="Push notifications"
            value={s.pushNotifications}
            onValueChange={(v) => save({ ...s, pushNotifications: v })}
            isLast
          />
        </Card>

        <Text style={lblStyle(t)}>Reminders</Text>
        <Card variant="elevated" padding={0}>
          <Row icon="time-outline" title="Habit reminders" detail={`Daily at ${s.reminderTime}`} value={s.habitReminders} onValueChange={(v) => save({ ...s, habitReminders: v })} disabled={!isEnabled} />
          <Row icon="sunny-outline" title="Daily summary" detail="Morning brief of today's habits" value={s.dailySummary} onValueChange={(v) => save({ ...s, dailySummary: v })} disabled={!isEnabled} />
          <Row icon="calendar-outline" title="Weekly reports" value={s.weeklyReports} onValueChange={(v) => save({ ...s, weeklyReports: v })} disabled={!isEnabled} isLast />
        </Card>

        <Text style={lblStyle(t)}>Activity</Text>
        <Card variant="elevated" padding={0}>
          <Row icon="trophy-outline" title="Achievement alerts" value={s.achievementAlerts} onValueChange={(v) => save({ ...s, achievementAlerts: v })} disabled={!isEnabled} />
          <Row icon="flame-outline" title="Challenge updates" value={s.challengeUpdates} onValueChange={(v) => save({ ...s, challengeUpdates: v })} disabled={!isEnabled} isLast />
        </Card>

        <Text style={lblStyle(t)}>Quiet hours</Text>
        <Card variant="elevated" padding={0}>
          <Row icon="moon-outline" title="Quiet hours" detail={`${s.quietHoursStart} – ${s.quietHoursEnd}`} value={s.quietHoursEnabled} onValueChange={(v) => save({ ...s, quietHoursEnabled: v })} disabled={!isEnabled} isLast />
        </Card>

        <Text style={lblStyle(t)}>Sound</Text>
        <Card variant="elevated" padding={0}>
          <Row icon="volume-medium-outline" title="Sound" value={s.soundEnabled} onValueChange={(v) => save({ ...s, soundEnabled: v })} disabled={!isEnabled} />
          <Row icon="phone-portrait-outline" title="Vibration" value={s.vibrationEnabled} onValueChange={(v) => save({ ...s, vibrationEnabled: v })} disabled={!isEnabled} isLast />
        </Card>

        <Button title="Send test notification" variant="secondary" fullWidth style={{ marginTop: 16 }} onPress={sendTest} disabled={!isEnabled} />
      </ScrollView>
    </Screen>
  );
};

const lblStyle = (t: any) => ({
  fontSize: 11,
  fontWeight: '700' as const,
  color: t.colors.ink3,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.7,
  paddingLeft: 4,
  marginTop: 22,
  marginBottom: 10,
});
