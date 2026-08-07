import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FrequencyType, HabitType, MicroStep } from '../../types';
import { RootStackScreenProps } from '../../types/navigation';
import { dataService } from '../../services/core';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button, Field, HabitRow } from '../../components/ds';
import { v4 as uuidv4 } from 'uuid';
import { Glyph, GlyphName, resolveGlyph } from '../../components/art';

type CreateEditHabitScreenProps =
  | RootStackScreenProps<'CreateHabit'>
  | RootStackScreenProps<'CreateEditHabit'>
  | RootStackScreenProps<'EditHabit'>
  | RootStackScreenProps<'HabitEdit'>;

const FREQS: { label: string; value: FrequencyType }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Custom', value: 'custom' },
];

const ICON_OPTIONS: GlyphName[] = [
  'target',
  'run',
  'walk',
  'strength',
  'stretch',
  'bike',
  'meditate',
  'breathe',
  'water',
  'nutrition',
  'sleep',
  'read',
  'study',
  'write',
  'journal',
  'music',
  'draw',
  'code',
  'work',
  'plan',
  'people',
  'nature',
  'sunrise',
  'offline',
];

// Atomic Habits advises two to four; more than that stops being 'tiny'.
const MAX_MICRO_STEPS = 4;

const CATEGORIES: { icon: GlyphName; label: string }[] = [
  { icon: 'run', label: 'Fitness' },
  { icon: 'brain', label: 'Mind' },
  { icon: 'study', label: 'Learn' },
  { icon: 'nutrition', label: 'Health' },
  { icon: 'work', label: 'Work' },
  { icon: 'sleep', label: 'Rest' },
];

const UNITS = ['times', 'minutes', 'pages', 'glasses', 'reps', 'km'];

export const CreateEditHabitScreen: React.FC<CreateEditHabitScreenProps> = ({ navigation, route }) => {
  const t = useTheme();
  const isEditing =
    ('habitId' in route.params && !!route.params.habitId) ||
    ('habit' in route.params && !!route.params.habit);
  const habitId =
    'habitId' in route.params ? route.params.habitId : 'habit' in route.params ? route.params.habit?.id : null;
  const existing = 'habit' in route.params ? route.params.habit : null;
  const template = 'template' in route.params ? route.params.template : null;

  const [title, setTitle] = useState(existing?.title ?? template?.title ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? template?.notes ?? '');
  // An existing habit may still carry a legacy emoji, so normalise on load —
  // otherwise nothing in the picker would appear selected.
  const [icon, setIcon] = useState<GlyphName>(() =>
    resolveGlyph(existing?.emoji ?? template?.emoji, existing?.title ?? template?.title)
  );
  const [color, setColor] = useState(existing?.color ?? template?.color ?? t.habitColors[0]);
  const [frequency, setFrequency] = useState<FrequencyType>(existing?.frequency ?? template?.frequency ?? 'daily');
  const [habitType, setHabitType] = useState<HabitType>(existing?.type ?? 'manual');
  const [targetValue, setTargetValue] = useState<number>(existing?.targetConfig?.targetValue ?? 1);
  const [targetUnit, setTargetUnit] = useState<string>(existing?.targetConfig?.unit ?? 'times');
  const [isTimeBased, setIsTimeBased] = useState<boolean>(!!existing?.targetConfig?.isTimeBased);
  const [category, setCategory] = useState<string | null>(null);
  const [microSteps, setMicroSteps] = useState<MicroStep[]>(
    () => existing?.microSteps ?? []
  );
  const [newStep, setNewStep] = useState('');
  const [saving, setSaving] = useState(false);

  const addMicroStep = () => {
    const title = newStep.trim();
    if (!title || microSteps.length >= MAX_MICRO_STEPS) return;
    setMicroSteps((prev) => [...prev, { id: uuidv4(), title }]);
    setNewStep('');
  };

  const removeMicroStep = (id: string) => {
    setMicroSteps((prev) => prev.filter((s) => s.id !== id));
  };

  useEffect(() => {
    navigation.setOptions?.({ headerShown: false });
  }, [navigation]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Add a name', 'Give this habit a clear, small name.');
      return;
    }
    setSaving(true);
    try {
      const habitData = {
        title: title.trim(),
        notes: notes.trim(),
        frequency,
        type: habitType,
        color,
        emoji: icon,
        microSteps,
        isShared: existing?.isShared ?? false,
        targetConfig: {
          hasTarget: true,
          targetValue,
          unit: isTimeBased ? 'minutes' : targetUnit,
          isTimeBased,
        },
      };

      if (isEditing && habitId) {
        await dataService.updateHabit(habitId, habitData);
        navigation.goBack();
      } else {
        const result = await dataService.createHabit(habitData);
        if ((result as any)?.blocked) {
          // No habit cap in v1, so this should not trigger — surface the
          // reason rather than pointing at a paywall that no longer exists.
          Alert.alert('Could not create habit', (result as any).reason ?? 'Please try again.');
        } else {
          navigation.goBack();
        }
      }
    } catch (e) {
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const tint = (hex: string, ratio: number, bg: string): string => {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const bh = bg.replace('#', '');
    const br = parseInt(bh.slice(0, 2), 16);
    const bg2 = parseInt(bh.slice(2, 4), 16);
    const bb = parseInt(bh.slice(4, 6), 16);
    const mr = Math.round(r * ratio + br * (1 - ratio));
    const mg = Math.round(g * ratio + bg2 * (1 - ratio));
    const mb = Math.round(b * ratio + bb * (1 - ratio));
    return `#${mr.toString(16).padStart(2, '0')}${mg.toString(16).padStart(2, '0')}${mb.toString(16).padStart(2, '0')}`;
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <AppHeader title={isEditing ? 'Edit habit' : 'New habit'} large={false} back onBack={() => navigation.goBack()} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ color: t.colors.ink, fontSize: 22, fontWeight: '700', letterSpacing: -0.4, marginBottom: 4 }}>
            Name this habit
          </Text>
          <Text style={{ color: t.colors.ink2, fontSize: 14, marginBottom: 16 }}>
            Keep it small. "Read 1 page" beats "Read more".
          </Text>

          {/* Name + icon */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                backgroundColor: tint(color, 0.16, t.colors.bgPaper),
                borderWidth: 1.5,
                borderColor: tint(color, 0.3, 'transparent'),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Glyph name={icon} size={34} color={color} surface={tint(color, 0.16, t.colors.bgPaper)} />
            </View>
            <View style={{ flex: 1 }}>
              <Field placeholder="Run in the morning" value={title} onChangeText={setTitle} autoFocus />
            </View>
          </View>

          {/* Icon */}
          <Text style={labelStyle(t)}>Icon</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {ICON_OPTIONS.map((g) => {
              const sel = g === icon;
              const surface = sel ? t.colors.bgElev : t.colors.bgPaper;
              return (
                <Pressable
                  key={g}
                  onPress={() => setIcon(g)}
                  accessibilityRole="button"
                  accessibilityLabel={`${g} icon`}
                  accessibilityState={{ selected: sel }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: surface,
                    borderWidth: sel ? 1.5 : 0,
                    borderColor: sel ? color : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Glyph
                    name={g}
                    size={26}
                    color={sel ? color : t.colors.ink2}
                    surface={surface}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* Color */}
          <Text style={labelStyle(t)}>Color</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            {t.habitColors.map((c) => {
              const sel = c === color;
              return (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  accessibilityRole="button"
                  accessibilityLabel="Habit color"
                  accessibilityState={{ selected: color === c }}
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

          {/* Category */}
          <Text style={labelStyle(t)}>Category</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((c) => {
              const active = category === c.label;
              return (
                <Pressable
                  key={c.label}
                  onPress={() => setCategory(active ? null : c.label)}
                  accessibilityRole="button"
                  accessibilityLabel={c.label}
                  accessibilityState={{ selected: active }}
                  style={{
                    height: 32,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: active ? t.colors.primary : t.colors.bgPaper,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Glyph
                    name={c.icon}
                    size={16}
                    color={active ? '#FFFFFF' : t.colors.ink2}
                    surface={active ? t.colors.primary : t.colors.bgPaper}
                  />
                  <Text style={{ color: active ? '#FFFFFF' : t.colors.ink2, fontSize: 13, fontWeight: '600' }}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Frequency */}
          <Text style={labelStyle(t)}>Frequency</Text>
          <View style={{ flexDirection: 'row', padding: 4, gap: 4, backgroundColor: t.colors.bgPaper, borderRadius: 14 }}>
            {FREQS.map((f) => {
              const active = frequency === f.value;
              return (
                <Pressable
                  key={f.value}
                  onPress={() => setFrequency(f.value)}
                  accessibilityRole="button"
                  accessibilityLabel={f.label}
                  accessibilityState={{ selected: frequency === f.value }}
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

          {/* Tracking type */}
          <Text style={labelStyle(t)}>Tracking</Text>
          <View style={{ flexDirection: 'row', padding: 4, gap: 4, backgroundColor: t.colors.bgPaper, borderRadius: 14 }}>
            <Pressable
              onPress={() => setIsTimeBased(false)}
              accessibilityRole="button"
              accessibilityLabel="Count based goal"
              accessibilityState={{ selected: !isTimeBased }}
              style={{
                flex: 1,
                height: 36,
                borderRadius: 10,
                backgroundColor: !isTimeBased ? t.colors.bgElev : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color={!isTimeBased ? t.colors.ink : t.colors.ink2} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: !isTimeBased ? t.colors.ink : t.colors.ink2 }}>Count</Text>
            </Pressable>
            <Pressable
              onPress={() => setIsTimeBased(true)}
              accessibilityRole="button"
              accessibilityLabel="Time based goal"
              accessibilityState={{ selected: isTimeBased }}
              style={{
                flex: 1,
                height: 36,
                borderRadius: 10,
                backgroundColor: isTimeBased ? t.colors.bgElev : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              }}
            >
              <Ionicons name="timer-outline" size={16} color={isTimeBased ? t.colors.ink : t.colors.ink2} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: isTimeBased ? t.colors.ink : t.colors.ink2 }}>Time</Text>
            </Pressable>
          </View>

          {/* Target value */}
          <Text style={labelStyle(t)}>Target</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable
              onPress={() => setTargetValue(Math.max(1, targetValue - 1))}
              accessibilityRole="button"
              accessibilityLabel="Decrease target"

              style={{ width: 44, height: 52, borderRadius: 14, backgroundColor: t.colors.bgPaper, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="remove" size={20} color={t.colors.ink} />
            </Pressable>
            <View
              style={{
                flex: 1,
                height: 52,
                borderRadius: 14,
                backgroundColor: t.colors.bgPaper,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              }}
            >
              <Text style={{ color: t.colors.ink, fontSize: 18, fontWeight: '700' }}>{targetValue}</Text>
              <Text style={{ color: t.colors.ink3, fontSize: 14 }}>{isTimeBased ? 'minutes' : targetUnit}</Text>
            </View>
            <Pressable
              onPress={() => setTargetValue(targetValue + 1)}
              accessibilityRole="button"
              accessibilityLabel="Increase target"

              style={{ width: 44, height: 52, borderRadius: 14, backgroundColor: t.colors.bgPaper, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="add" size={20} color={t.colors.ink} />
            </Pressable>
          </View>
          {!isTimeBased && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {UNITS.map((u) => (
                <Pressable
                  key={u}
                  onPress={() => setTargetUnit(u)}
                  accessibilityRole="button"
                  accessibilityLabel={`Unit: ${u}`}
                  accessibilityState={{ selected: targetUnit === u }}
                  style={{
                    height: 28,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: targetUnit === u ? t.colors.ink : t.colors.bgPaper,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: targetUnit === u ? t.colors.bg : t.colors.ink2, fontSize: 12, fontWeight: '600' }}>{u}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Notes */}
          <Text style={labelStyle(t)}>Notes (optional)</Text>
          <Field placeholder="Why does this matter?" value={notes} onChangeText={setNotes} multiline />

          {/* Micro-steps */}
          <Text style={labelStyle(t)}>Micro-steps (optional)</Text>
          <Text style={{ color: t.colors.ink2, fontSize: 13, marginBottom: 10 }}>
            Break this into up to {MAX_MICRO_STEPS} tiny actions. You can tick them
            off each day on the habit's page.
          </Text>

          {microSteps.map((step, i) => (
            <View
              key={step.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 10,
                paddingHorizontal: 12,
                marginBottom: 8,
                borderRadius: t.radius.input,
                backgroundColor: t.colors.bgPaper,
              }}
            >
              <Text style={{ color: t.colors.ink3, fontSize: 13, fontWeight: '700' }}>{i + 1}</Text>
              <Text style={{ flex: 1, color: t.colors.ink, fontSize: 14 }} numberOfLines={2}>
                {step.title}
              </Text>
              <Pressable
                onPress={() => removeMicroStep(step.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Remove step ${step.title}`}
              >
                <Ionicons name="close" size={18} color={t.colors.ink3} />
              </Pressable>
            </View>
          ))}

          {microSteps.length < MAX_MICRO_STEPS && (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Field
                  placeholder={microSteps.length === 0 ? 'Put my running shoes on' : 'Add another step'}
                  value={newStep}
                  onChangeText={setNewStep}
                  onSubmitEditing={addMicroStep}
                  returnKeyType="done"
                />
              </View>
              <Button
                title="Add"
                variant="secondary"
                size="sm"
                onPress={addMicroStep}
                disabled={!newStep.trim()}
                accessibilityLabel="Add micro-step"
              />
            </View>
          )}

          {/* Preview */}
          <Text style={labelStyle(t)}>Preview</Text>
          <HabitRow
            icon={icon}
            name={title || 'New habit'}
            target={`${frequency === 'daily' ? 'Daily' : frequency === 'weekly' ? 'Weekly' : 'Custom'} · ${targetValue} ${isTimeBased ? 'min' : targetUnit}`}
            color={color}
            done={0}
            total={targetValue}
          />

          <Button title={isEditing ? 'Save changes' : 'Create habit'} loading={saving} onPress={handleSave} fullWidth style={{ marginTop: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const labelStyle = (t: any) => ({
  fontSize: 11,
  fontWeight: '700' as const,
  color: t.colors.ink3,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.7,
  marginTop: 22,
  marginBottom: 10,
});
