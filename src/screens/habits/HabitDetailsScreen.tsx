import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HabitWithStats, HabitProgressStatus } from '../../types';
import { RootStackScreenProps } from '../../types/navigation';
import { dataService } from '../../services/core';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, Card, Button, Stat, HeatGrid, Chip } from '../../components/ds';

type HabitDetailsScreenProps = RootStackScreenProps<'HabitDetails'>;

const emojiFor = (title: string): string => {
  const t = (title || '').toLowerCase();
  if (t.includes('run')) return '🏃';
  if (t.includes('read') || t.includes('book')) return '📚';
  if (t.includes('meditat')) return '🧘';
  if (t.includes('exercise')) return '💪';
  if (t.includes('water') || t.includes('hydrat')) return '💧';
  if (t.includes('sleep')) return '🌙';
  if (t.includes('walk')) return '🚶';
  if (t.includes('write') || t.includes('journal')) return '✍️';
  return '🎯';
};

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

export const HabitDetailsScreen: React.FC<HabitDetailsScreenProps> = ({ navigation, route }) => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { habitId } = route.params;

  const [habit, setHabit] = useState<HabitWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  const accent = habit?.color || t.colors.primary;
  const isDayOne = (habit?.totalCompletions ?? 0) === 0 && (habit?.currentStreak ?? 0) === 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await dataService.getUserData();
        const found = (data.habits ?? []).find((h: any) => h.id === habitId);
        if (cancelled) return;
        if (!found) {
          setError('not_found');
        } else {
          setHabit(found as HabitWithStats);
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

  const heatData = useMemo(() => {
    // Synthetic heatmap until backend progress wiring is plumbed through.
    const total = 8 * 7;
    return Array.from({ length: total }, (_, i) => {
      const v = (Math.sin(i * 0.7) + Math.cos(i * 0.3) + 2) * 1.1;
      return Math.max(0, Math.min(4, Math.floor(v)));
    });
  }, [habitId]);

  const handleEdit = () => {
    navigation.navigate('EditHabit', { habitId });
  };

  const handleMoreMenu = () => {
    Alert.alert(habit?.title ?? 'Habit', undefined, [
      { text: 'Edit', onPress: handleEdit },
      { text: 'Start timer', onPress: () => navigation.navigate('HabitTimer', { habitId }) },
      { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Delete', 'Not implemented yet.') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleMarkComplete = async () => {
    if (!habit) return;
    try {
      const today = new Date().toISOString().split('T')[0];
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
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
                  alignItems: 'center',
                  justifyContent: 'center',
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
              <Text style={{ fontSize: 36 }}>{habit.emoji || emojiFor(habit.title)}</Text>
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
              <Text style={{ fontSize: 48 }}>🌱</Text>
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
              <HeatGrid rows={8} cols={7} data={heatData} todayIdx={55} color={accent} />
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

          {/* Micro-steps placeholder */}
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
              <Chip label="0 / 0" />
            </View>
            <Text style={{ color: t.colors.ink2, fontSize: 13, marginTop: 2 }}>
              Break this habit into 2–4 tiny steps. Edit the habit to add them.
            </Text>
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
