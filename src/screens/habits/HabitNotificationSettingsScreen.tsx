import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { enhancedNotificationService } from '../../services/notifications';
import { dataService } from '../../services/core';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button } from '../../components/ds';

const HabitNotificationSettingsScreen: React.FC = () => {
  const t = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { habitId } = route.params as { habitId: string };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [habit, setHabit] = useState<any>(null);
  const [settings, setSettings] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await dataService.initialize();
      const habitData = await dataService.getHabitById(habitId);
      const s = await enhancedNotificationService.getHabitReminderSettings(habitId);
      setHabit(habitData);
      setSettings(s);
    } catch {
      Alert.alert('Could not load', 'Try again later.');
    } finally {
      setLoading(false);
    }
  }, [habitId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await enhancedNotificationService.saveHabitReminderSettings(settings);
      navigation.goBack();
    } catch {
      Alert.alert('Could not save', 'Try again later.');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: any) => setSettings({ ...settings, ...updates });

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Smart notifications" back onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!settings || !habit) {
    return (
      <Screen>
        <AppHeader title="Smart notifications" back onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: t.colors.ink2 }}>Could not load notification settings.</Text>
        </View>
      </Screen>
    );
  }

  const times: string[] = settings.reminderTimes ?? [];
  const enabled: boolean = settings.enabled ?? true;
  const smart: boolean = settings.smartTiming ?? false;

  return (
    <Screen>
      <AppHeader
        title="Smart notifications"
        subtitle={habit.title}
        back
        onBack={() => navigation.goBack()}
        action={
          <Pressable
            onPress={save}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Save notification settings"
          >
            <Text style={{ color: t.colors.primary, fontSize: 14, fontWeight: '700' }}>Save</Text>
          </Pressable>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 60, gap: 14 }}>
        {/* Master toggle */}
        <Card variant="elevated" padding={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: t.colors.bgPaper,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="notifications-outline" size={18} color={t.colors.ink2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }}>Reminders</Text>
            <Text style={{ color: t.colors.ink3, fontSize: 12 }}>
              {enabled ? `${times.length} active` : 'All off'}
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={(v) => updateSettings({ enabled: v })}
            trackColor={{ true: t.colors.primary, false: t.colors.line }}
          />
        </Card>

        {/* Smart timing */}
        <Card variant="elevated" padding={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: t.colors.bgPaper,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="sparkles-outline" size={18} color={t.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }}>Smart timing</Text>
            <Text style={{ color: t.colors.ink3, fontSize: 12 }}>Learn the best time to nudge.</Text>
          </View>
          <Switch
            value={smart}
            onValueChange={(v) => updateSettings({ smartTiming: v })}
            trackColor={{ true: t.colors.primary, false: t.colors.line }}
          />
        </Card>

        {/* Reminder times */}
        <Text
          style={{
            color: t.colors.ink3,
            fontSize: 11,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.7,
            marginTop: 8,
          }}
        >
          Reminder times
        </Text>
        <Card variant="elevated" padding={0}>
          {times.length === 0 ? (
            <Text style={{ color: t.colors.ink3, fontSize: 13, padding: 16 }}>No reminders. Add one below.</Text>
          ) : (
            times.map((time, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: i < times.length - 1 ? 1 : 0,
                  borderBottomColor: t.colors.lineSoft,
                  gap: 12,
                }}
              >
                <Ionicons name="time-outline" size={18} color={t.colors.ink2} />
                <Text style={{ color: t.colors.ink, fontSize: 15, fontWeight: '600', flex: 1 }}>{time}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove reminder at ${time}`}
                  onPress={() => {
                    const newTimes = times.filter((_, idx) => idx !== i);
                    updateSettings({ reminderTimes: newTimes });
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color={t.colors.danger} />
                </Pressable>
              </View>
            ))
          )}
        </Card>
        <Button
          title="Add reminder time"
          variant="secondary"
          fullWidth
          leftIcon={<Ionicons name="add" size={18} color={t.colors.ink} />}
          onPress={() => {
            if (times.length >= 4) {
              Alert.alert('Limit', 'Up to 4 reminders per habit.');
              return;
            }
            updateSettings({ reminderTimes: [...times, '09:00'] });
          }}
        />

        <Button title="Save changes" loading={saving} onPress={save} fullWidth style={{ marginTop: 12 }} />
      </ScrollView>
    </Screen>
  );
};

export default HabitNotificationSettingsScreen;
