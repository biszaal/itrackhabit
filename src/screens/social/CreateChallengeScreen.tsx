import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CreateChallengeRequest } from '../../types';
import { challengeService } from '../../services/social';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button, Field } from '../../components/ds';

interface CreateChallengeScreenProps {
  navigation: any;
}

const HABIT_TYPES = [
  { label: 'Read', emoji: '📚', value: 'reading', unit: 'pages' },
  { label: 'Exercise', emoji: '🏋️', value: 'exercise', unit: 'minutes' },
  { label: 'Meditate', emoji: '🧘', value: 'meditation', unit: 'minutes' },
  { label: 'Hydrate', emoji: '💧', value: 'hydration', unit: 'glasses' },
  { label: 'Walk', emoji: '🚶', value: 'walking', unit: 'steps' },
  { label: 'Study', emoji: '🎓', value: 'learning', unit: 'minutes' },
  { label: 'Sleep', emoji: '🌙', value: 'sleep', unit: 'hours' },
  { label: 'Run', emoji: '🏃', value: 'running', unit: 'km' },
];

const DURATIONS = [
  { label: '7d', value: 7 },
  { label: '14d', value: 14 },
  { label: '30d', value: 30 },
  { label: '60d', value: 60 },
  { label: '90d', value: 90 },
];

export const CreateChallengeScreen: React.FC<CreateChallengeScreenProps> = ({ navigation }) => {
  const t = useTheme();
  const [form, setForm] = useState<CreateChallengeRequest>({
    title: '',
    description: '',
    habitType: '',
    targetValue: 1,
    targetUnit: '',
    durationDays: 30,
    isPublic: false,
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.habitType || !form.targetUnit || form.targetValue <= 0) {
      Alert.alert('Missing info', 'Fill in title, habit type, and target.');
      return;
    }
    setLoading(true);
    try {
      await challengeService.createChallenge(form);
      Alert.alert('Created', 'Challenge created.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Could not create', 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = HABIT_TYPES.find((h) => h.value === form.habitType);

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <AppHeader title="New challenge" large={false} back onBack={() => navigation.goBack()} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 120, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          <Field label="Title" placeholder="30 days of reading" value={form.title} onChangeText={(title) => setForm({ ...form, title })} autoFocus />
          <Field
            label="Description"
            placeholder="Why this matters"
            value={form.description}
            onChangeText={(description) => setForm({ ...form, description })}
            multiline
          />

          <Text style={lblStyle(t)}>Habit type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {HABIT_TYPES.map((h) => {
              const active = form.habitType === h.value;
              return (
                <Pressable
                  key={h.value}
                  onPress={() => setForm({ ...form, habitType: h.value, targetUnit: h.unit })}
                  style={{
                    height: 36,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: active ? t.colors.ink : t.colors.bgPaper,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{h.emoji}</Text>
                  <Text style={{ color: active ? t.colors.bg : t.colors.ink2, fontSize: 13, fontWeight: '600' }}>{h.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={lblStyle(t)}>Target</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Field
                value={String(form.targetValue)}
                onChangeText={(v) => setForm({ ...form, targetValue: Number(v) || 0 })}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                placeholder={selectedType?.unit ?? 'unit'}
                value={form.targetUnit}
                onChangeText={(v) => setForm({ ...form, targetUnit: v })}
              />
            </View>
          </View>

          <Text style={lblStyle(t)}>Duration</Text>
          <View style={{ flexDirection: 'row', padding: 4, gap: 4, backgroundColor: t.colors.bgPaper, borderRadius: 14 }}>
            {DURATIONS.map((d) => {
              const active = form.durationDays === d.value;
              return (
                <Pressable
                  key={d.value}
                  onPress={() => setForm({ ...form, durationDays: d.value })}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: active ? t.colors.bgElev : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: active ? t.colors.ink : t.colors.ink2 }}>{d.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Card variant="elevated" padding={16} style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
              <Ionicons name="globe-outline" size={18} color={t.colors.ink2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }}>Public</Text>
              <Text style={{ color: t.colors.ink3, fontSize: 12 }}>Anyone can find and join.</Text>
            </View>
            <Switch
              value={form.isPublic}
              onValueChange={(v) => setForm({ ...form, isPublic: v })}
              trackColor={{ true: t.colors.primary, false: t.colors.line }}
            />
          </Card>

          <Button title="Create challenge" loading={loading} onPress={handleCreate} fullWidth style={{ marginTop: 12 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const lblStyle = (t: any) => ({
  fontSize: 11,
  fontWeight: '700' as const,
  color: t.colors.ink3,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.7,
  marginTop: 14,
  marginBottom: 8,
});
