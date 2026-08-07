import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HabitWithStats, HabitProgressStatus, HabitProgress as Progress } from '../../types';
import { RootStackScreenProps } from '../../types/navigation';
import { dataService } from '../../services/core';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, Card, Button, Stat, HeatGrid, Chip } from '../../components/ds';
import { Glyph, Illustration, resolveGlyph } from '../../components/art';
import { toLocalISODate } from '../../utils/formatting/time';

type HabitDetailsScreenProps = RootStackScreenProps<'HabitDetails'>;

const tint = (hex: string, ratio: number, bg = '#FFFFFF'): string => {
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

interface Note {
  date: string;
  status: HabitProgressStatus;
  text?: string;
}

// 8 rows x 7 cols of the heat grid.
const HEAT_DAYS = 56;


export const HabitDetailsScreen: React.FC<HabitDetailsScreenProps> = ({ navigation, route }) => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { habitId } = route.params;

  const [habit, setHabit] = useState<HabitWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState<Progress[]>([]);
  // Step *definitions* live on the habit; which are ticked is per-day, so it
  // comes from today's progress record and resets each morning.
  const [stepsDone, setStepsDone] = useState<string[]>([]);

  const microSteps = habit?.microSteps ?? [];

  const toggleMicroStep = async (stepId: string) => {
    const today = toLocalISODate();
    const next = stepsDone.includes(stepId)
      ? stepsDone.filter((id) => id !== stepId)
      : [...stepsDone, stepId];

    const previous = stepsDone;
    setStepsDone(next); // optimistic — a checkbox should respond immediately

    try {
      // Preserve the day's status: ticking a step is not the same as
      // completing the habit.
      const todayRecord = progress.find((p) => p.date === today);
      await dataService.markHabitProgress(
        habitId,
        today,
        (todayRecord?.status as any) ?? 'partial',
        { microStepsDone: next }
      );
    } catch {
      setStepsDone(previous);
      Alert.alert('Sorry', 'Could not save that step. Try again.');
    }
  };

  const accent = habit?.color || t.colors.primary;
  const isDayOne = (habit?.totalCompletions ?? 0) === 0 && (habit?.currentStreak ?? 0) === 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - (HEAT_DAYS - 1));

        const [data, records] = await Promise.all([
          dataService.getUserData(),
          dataService
            .getHabitProgress(habitId, toLocalISODate(start), toLocalISODate(new Date()))
            .catch(() => [] as Progress[]),
        ]);

        const found = (data.habits ?? []).find((h: any) => h.id === habitId);
        if (cancelled) return;
        if (!found) {
          setError('not_found');
        } else {
          setHabit(found as HabitWithStats);
          setProgress(records);
          const todayRecord = records.find((r) => r.date === toLocalISODate());
          setStepsDone(todayRecord?.microStepsDone ?? []);
          setNotes(
            records
              .filter((r) => (r.notes ?? '').trim().length > 0)
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((r) => ({ date: r.date, status: r.status, text: r.notes }))
          );
        }
      } catch (e) {
        if (!cancelled) setError('load_failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [habitId]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Intensity 0..4 for one day's record. `done` is full strength; a partial
  // entry scales by how much of the target was met so the grid distinguishes
  // "barely started" from "nearly there".
  const intensityFor = (p: Progress | undefined): number => {
    if (!p) return 0;
    if (p.status === 'done') return 4;
    if (p.status === 'partial') {
      const target = p.targetValue ?? 0;
      const current = p.currentValue ?? 0;
      if (target <= 0) return 2;
      const ratio = Math.max(0, Math.min(1, current / target));
      return Math.min(3, Math.max(1, Math.round(ratio * 4)));
    }
    return 0; // skipped or no record
  };

  const heatData = useMemo(() => {
    const byDate = new Map(progress.map((p) => [p.date, p]));
    // 8 rows x 7 cols, oldest first, ending on today (last cell).
    return Array.from({ length: HEAT_DAYS }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (HEAT_DAYS - 1 - i));
      return intensityFor(byDate.get(toLocalISODate(d)));
    });
  }, [progress]);

  const handleEdit = () => {
    navigation.navigate('EditHabit', { habitId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete habit?',
      `"${habit?.title ?? 'This habit'}" and its history will be removed. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await dataService.deleteHabit(habitId);
              navigation.goBack();
            } catch {
              setDeleting(false);
              Alert.alert('Sorry', 'Could not delete this habit. Try again.');
            }
          },
        },
      ]
    );
  };

  const handleMoreMenu = () => {
    Alert.alert(habit?.title ?? 'Habit', undefined, [
      { text: 'Edit', onPress: handleEdit },
      { text: 'Start timer', onPress: () => navigation.navigate('HabitTimer', { habitId }) },
      { text: 'Delete', style: 'destructive', onPress: handleDelete },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleMarkComplete = async () => {
    if (!habit) return;
    try {
      const today = toLocalISODate();
      await dataService.markHabitProgress(habit.id, today, 'done');
      setHabit({ ...habit, isDoneToday: true });
    } catch {
      Alert.alert('Sorry', 'Could not save your progress. Try again.');
    }
  };

  const handleStartTimer = () => {
    navigation.navigate('HabitTimer', { habitId });
  };

  // ─── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <Screen>
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: t.spacing.screen }}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: t.colors.bgPaper,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={20} color={t.colors.ink} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      </Screen>
    );
  }

  // ─── Error state ───────────────────────────────────────────────
  if (error || !habit) {
    return (
      <Screen>
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: t.spacing.screen }}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: t.colors.bgPaper,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={20} color={t.colors.ink} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 14 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: tint(t.colors.danger, 0.12, t.colors.bgPaper),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="alert-circle-outline" size={28} color={t.colors.danger} />
          </View>
          <Text style={{ color: t.colors.ink, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 }}>
            Couldn't load this habit
          </Text>
          <Text style={{ color: t.colors.ink2, fontSize: 14, textAlign: 'center', maxWidth: 300 }}>
            Your local check-ins for today are safe. Try again in a moment.
          </Text>
          <Button title="Try again" onPress={() => navigation.replace('HabitDetails', { habitId })} style={{ marginTop: 12 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Color hero */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 280,
            backgroundColor: tint(accent, 0.22, t.colors.bg),
          }}
        />

        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: t.spacing.screen,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={20} color={t.colors.ink} />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={handleEdit}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Edit habit"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="create-outline" size={18} color={t.colors.ink2} />
              </Pressable>
              <Pressable
                onPress={handleMoreMenu}
                disabled={deleting}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="More options"
                accessibilityState={{ disabled: deleting }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: deleting ? 0.5 : 1,
                }}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color={t.colors.ink2} />
              </Pressable>
            </View>
          </View>

          {/* Title row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View
              style={[
                {
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: tint(accent, 0.18, t.colors.bgElev),
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                t.shadow.sh1,
              ]}
            >
              <Glyph
                name={resolveGlyph(habit.emoji, habit.title)}
                size={36}
                color={accent}
                surface={tint(accent, 0.18, t.colors.bgElev)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: t.colors.ink,
                  fontSize: 28,
                  fontWeight: '700',
                  letterSpacing: -0.7,
                  lineHeight: 32,
                }}
              >
                {habit.title}
              </Text>
              <Text style={{ color: t.colors.ink2, fontSize: 13, marginTop: 4 }}>
                {habit.frequency === 'daily' ? 'Every day' : habit.frequency === 'weekly' ? 'Weekly' : 'Custom'}
                {habit.notes ? ` · ${habit.notes}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={{ paddingHorizontal: t.spacing.screen, paddingTop: 24 }}>
          {/* Stats trio */}
          <Card variant="elevated" padding={18} style={{ flexDirection: 'row', gap: 12 }}>
            <Stat label="Current" value={habit.currentStreak ?? 0} suffix="d" accent={accent} />
            <View style={{ width: 1, backgroundColor: t.colors.lineSoft }} />
            <Stat label="Longest" value={habit.longestStreak ?? 0} suffix="d" />
            <View style={{ width: 1, backgroundColor: t.colors.lineSoft }} />
            <Stat label="Completion" value={Math.round(habit.completionRate ?? 0)} suffix="%" />
          </Card>

          {/* Primary actions */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Button
              title={habit.isDoneToday ? 'Completed today' : 'Mark complete'}
              variant={habit.isDoneToday ? 'secondary' : 'primary'}
              leftIcon={<Ionicons name={habit.isDoneToday ? 'checkmark' : 'checkmark'} size={18} color={habit.isDoneToday ? t.colors.ink : '#FFFFFF'} />}
              onPress={handleMarkComplete}
              style={{ flex: 1 }}
            />
            <Button
              variant="secondary"
              iconOnly
              leftIcon={<Ionicons name="timer-outline" size={20} color={t.colors.ink} />}
              onPress={handleStartTimer}
            />
          </View>

          {/* Day-one empty state for new habits */}
          {isDayOne && (
            <Card variant="flat" padding={24} style={{ marginTop: 18, alignItems: 'center', gap: 12 }}>
              <Illustration
                name="firstHabit"
                width={172}
                color={accent}
                surface={t.colors.bgPaper}
              />
              <Text
                style={{
                  color: t.colors.ink,
                  fontSize: 22,
                  fontWeight: '700',
                  letterSpacing: -0.4,
                }}
              >
                Day one
              </Text>
              <Text
                style={{
                  color: t.colors.ink2,
                  fontSize: 14,
                  textAlign: 'center',
                  maxWidth: 280,
                }}
              >
                Streaks, heatmaps and notes appear after your first check-in.
              </Text>
            </Card>
          )}

          {/* Heatmap */}
          {!isDayOne && (
            <Card variant="elevated" padding={18} style={{ marginTop: 18 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <Text style={{ color: t.colors.ink, fontSize: 17, fontWeight: '600', letterSpacing: -0.2 }}>
                  Last 8 weeks
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: t.colors.ink3 }}>less</Text>
                  <View style={{ flexDirection: 'row', gap: 3 }}>
                    {[0, 1, 2, 3, 4].map((lvl) => {
                      const c =
                        lvl === 0
                          ? t.colors.bgPaper
                          : lvl === 4
                          ? accent
                          : tint(accent, [0.18, 0.4, 0.7][lvl - 1], t.colors.bgPaper);
                      return (
                        <View
                          key={lvl}
                          style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c }}
                        />
                      );
                    })}
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: t.colors.ink3 }}>more</Text>
                </View>
              </View>
              <HeatGrid rows={8} cols={7} data={heatData} todayIdx={HEAT_DAYS - 1} color={accent} />
            </Card>
          )}

          {/* Identity card */}
          <Card variant="elevated" padding={18} style={{ marginTop: 14 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: accent,
                textTransform: 'uppercase',
                letterSpacing: 0.7,
              }}
            >
              Identity
            </Text>
            <Text
              style={{
                color: t.colors.ink,
                fontSize: 18,
                fontWeight: '600',
                letterSpacing: -0.2,
                marginTop: 6,
                lineHeight: 24,
                fontStyle: 'italic',
              }}
            >
              "I am someone who shows up — even when it's small."
            </Text>
          </Card>

          {/* Micro-steps */}
          <Card variant="elevated" padding={18} style={{ marginTop: 14 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <Text style={{ color: t.colors.ink, fontSize: 17, fontWeight: '600', letterSpacing: -0.2 }}>
                Micro-steps
              </Text>
              {microSteps.length > 0 && (
                <Chip label={`${stepsDone.length} / ${microSteps.length}`} />
              )}
            </View>

            {microSteps.length === 0 ? (
              <>
                <Text style={{ color: t.colors.ink2, fontSize: 13, marginTop: 2 }}>
                  Break this habit into a few tiny actions, then tick them off as
                  you go.
                </Text>
                <Button
                  title="Add steps"
                  variant="secondary"
                  size="sm"
                  onPress={handleEdit}
                  style={{ alignSelf: 'flex-start', marginTop: 12 }}
                />
              </>
            ) : (
              <View style={{ marginTop: 4 }}>
                {microSteps.map((step) => {
                  const checked = stepsDone.includes(step.id);
                  return (
                    <Pressable
                      key={step.id}
                      onPress={() => toggleMicroStep(step.id)}
                      accessibilityRole="checkbox"
                      accessibilityLabel={step.title}
                      accessibilityState={{ checked }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: checked ? accent : t.colors.line,
                          backgroundColor: checked ? accent : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {checked && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          color: checked ? t.colors.ink3 : t.colors.ink,
                          fontSize: 14,
                          textDecorationLine: checked ? 'line-through' : 'none',
                        }}
                      >
                        {step.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Card>

          {/* Recent notes */}
          <Card variant="elevated" padding={18} style={{ marginTop: 14 }}>
            <Text
              style={{
                color: t.colors.ink,
                fontSize: 17,
                fontWeight: '600',
                letterSpacing: -0.2,
                marginBottom: 10,
              }}
            >
              Recent notes
            </Text>
            {notes.length === 0 ? (
              <Text style={{ color: t.colors.ink2, fontSize: 14 }}>
                Add a note after a check-in to track how a session felt.
              </Text>
            ) : (
              notes.slice(0, 4).map((n, i) => (
                <View
                  key={i}
                  style={{
                    paddingTop: i ? 12 : 0,
                    borderTopWidth: i ? 1 : 0,
                    borderTopColor: t.colors.lineSoft,
                    marginTop: i ? 12 : 0,
                  }}
                >
                  <Text
                    style={{
                      color: t.colors.ink3,
                      fontSize: 11,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.7,
                    }}
                  >
                    {new Date(n.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  {n.text && (
                    <Text style={{ color: t.colors.ink, fontSize: 14, marginTop: 2 }}>{n.text}</Text>
                  )}
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
};
