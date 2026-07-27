import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Habit, FrequencyType } from '../../types';
import { RootStackScreenProps } from '../../types/navigation';
import { dataService } from '../../services/core';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Button, Field } from '../../components/ds';

type HabitEditScreenProps = RootStackScreenProps<'HabitEdit'>;

const FREQS: { label: string; value: FrequencyType }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Custom', value: 'custom' },
];

const EMOJI_OPTIONS = ['🧘', '🏃', '📚', '💧', '✍️', '🌙', '🥗', '🎯', '💪', '🚶', '🛏️', '🎵'];

export const HabitEditScreen: React.FC<HabitEditScreenProps> = ({ navigation, route }) => {
  const t = useTheme();
  const { habit: initial } = route.params;
  const [habit, setHabit] = useState<Habit>(initial);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await dataService.initialize();
      await dataService.updateHabit(habit.id, {
        title: habit.title,
        notes: habit.notes,
        frequency: habit.frequency,
        color: habit.color,
        emoji: habit.emoji,
        targetConfig: habit.targetConfig,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete habit', `Delete "${habit.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await dataService.initialize();
            await dataService.deleteHabit(habit.id);
            navigation.navigate('Main' as any, { screen: 'Home', params: {} });
          } catch {
            Alert.alert('Could not delete', 'Try again.');
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <AppHeader title="Edit habit" large={false} back onBack={() => navigation.goBack()} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 140, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          <Field
            label="Title"
            value={habit.title}
            onChangeText={(title) => setHabit({ ...habit, title })}
            placeholder="Run in the morning"
          />

          <Field
            label="Notes"
            value={habit.notes ?? ''}
            onChangeText={(notes) => setHabit({ ...habit, notes })}
            placeholder="Why this matters"
            multiline
          />

          <Text style={lblStyle(t)}>Emoji</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {EMOJI_OPTIONS.map((e) => {
              const sel = e === habit.emoji;
              return (
                <Pressable
                  key={e}
                  onPress={() => setHabit({ ...habit, emoji: e })}
                  accessibilityRole="button"
                  accessibilityLabel={`Emoji ${e}`}
                  accessibilityState={{ selected: habit.emoji === e }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    backgroundColor: sel ? t.colors.bgElev : t.colors.bgPaper,
                    borderWidth: sel ? 1.5 : 0,
                    borderColor: habit.color ?? t.colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={lblStyle(t)}>Color</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            {t.habitColors.map((c) => {
              const sel = c === habit.color;
              return (
                <Pressable
                  key={c}
                  onPress={() => setHabit({ ...habit, color: c })}
                  accessibilityRole="button"
                  accessibilityLabel="Habit color"
                  accessibilityState={{ selected: habit.color === c }}
                  style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', position: 'relative' }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c }} />
                  {sel && (
                    <View
                      style={{
                        position: 'absolute',
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        borderWidth: 2,
                        borderColor: t.colors.ink,
                      }}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={lblStyle(t)}>Frequency</Text>
          <View style={{ flexDirection: 'row', padding: 4, gap: 4, backgroundColor: t.colors.bgPaper, borderRadius: 14 }}>
            {FREQS.map((f) => {
              const active = habit.frequency === f.value;
              return (
                <Pressable
                  key={f.value}
                  onPress={() => setHabit({ ...habit, frequency: f.value })}
                  accessibilityRole="button"
                  accessibilityLabel={f.label}
                  accessibilityState={{ selected: habit.frequency === f.value }}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: active ? t.colors.bgElev : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: active ? t.colors.ink : t.colors.ink2 }}>{f.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Button title="Save changes" loading={saving} onPress={handleSave} fullWidth style={{ marginTop: 12 }} />
          <Button title="Delete habit" variant="ghost" onPress={handleDelete} fullWidth textStyle={{ color: t.colors.danger }} />
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
