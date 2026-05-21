import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabScreenProps } from '../types/navigation';
import { dataService } from '../services/core';
import { timerService } from '../services/habits';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useSmartNotifications } from '../hooks/useSmartNotifications';
import {
  Screen,
  Card,
  Ring,
  DateStrip,
  HabitRow,
  FAB,
  WeekDots,
  OfflinePill,
  Button,
} from '../components/ds';

type HomeScreenProps = MainTabScreenProps<'Home'>;

const greetingFor = (d: Date) => {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const emojiFor = (title: string): string => {
  const t = (title || '').toLowerCase();
  if (t.includes('run')) return '🏃';
  if (t.includes('read') || t.includes('book')) return '📚';
  if (t.includes('meditat')) return '🧘';
  if (t.includes('exercise')) return '💪';
  if (t.includes('walk')) return '🚶';
  if (t.includes('sleep')) return '🌙';
  if (t.includes('water') || t.includes('hydrat')) return '💧';
  if (t.includes('yoga')) return '🧘';
  if (t.includes('gym')) return '🏋️';
  if (t.includes('bike') || t.includes('cycl')) return '🚴';
  if (t.includes('swim')) return '🏊';
  if (t.includes('write') || t.includes('journal')) return '✍️';
  if (t.includes('music')) return '🎵';
  if (t.includes('cook')) return '👨‍🍳';
  return '🎯';
};

const formatDateLong = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { recordActivity } = useSmartNotifications();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [habits, setHabits] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [, setTick] = useState(0);

  // Re-render once a second so timer-driven progress stays live
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await dataService.getUserData();
      setHabits(userData.habits ?? []);
    } catch (err) {
      console.warn('Failed to load home data', err);
      setHabits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = selectedDate.toDateString() === today.toDateString();

  const computeProgress = (habit: any) => {
    const target = habit.targetConfig?.targetValue ?? 1;
    const isTimeBased = habit.targetConfig?.isTimeBased ?? false;
    let current = habit.currentProgress?.currentValue ?? 0;

    const activeTimer = timerService.getTimer?.(habit.id);
    if (activeTimer && isTimeBased && isToday) {
      const m = Math.floor(activeTimer.currentTime / 60);
      if (activeTimer.currentTime === 0 && !activeTimer.isRunning && !activeTimer.isPaused) {
        current = 0;
      } else {
        current = Math.max(current, m);
      }
    }
    if (habit.isDoneToday) current = target;
    return { current, target, isTimeBased };
  };

  const completed = habits.filter((h) => h.isDoneToday).length;
  const totalCount = habits.length;
  const pct = totalCount > 0 ? completed / totalCount : 0;
  const pctLabel = Math.round(pct * 100);

  // Pull current streak from first habit with stats, fallback to 0
  const streak = habits.reduce((max, h) => Math.max(max, h.currentStreak ?? 0), 0);

  const handleOpenHabit = async (habitId: string) => {
    await recordActivity?.(habitId, 'viewed_habit');
    navigation.navigate('HabitDetails', { habitId });
  };

  const handleToggleHabit = async (habit: any) => {
    try {
      const newStatus = habit.isDoneToday ? 'skipped' : 'done';
      const today = new Date().toISOString().split('T')[0];
      await dataService.markHabitProgress(habit.id, today, newStatus);
      await loadData();
    } catch (e) {
      console.warn('toggle failed', e);
    }
  };

  const handleCreateHabit = () => {
    navigation.navigate('HabitTemplates');
  };

  const userName = (user?.name || '').split(' ')[0] || 'friend';

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.colors.ink3}
          />
        }
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: t.spacing.screen,
            paddingBottom: 8,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 36,
              marginBottom: 14,
            }}
          >
            <OfflinePill label="Synced just now" />
            <Pressable
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: t.colors.bgPaper,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="notifications-outline" size={18} color={t.colors.ink2} />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.colors.ink2, fontSize: 13 }}>{formatDateLong(today)}</Text>
              <Text
                style={{
                  color: t.colors.ink,
                  fontSize: 28,
                  fontWeight: '700',
                  letterSpacing: -0.7,
                  lineHeight: 34,
                  marginTop: 2,
                }}
              >
                {greetingFor(today)},{'\n'}
                {userName}.
              </Text>
            </View>

            {streak > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 8,
                  paddingLeft: 10,
                  paddingRight: 14,
                  borderRadius: 999,
                  backgroundColor: t.isDark ? 'rgba(224,122,119,0.16)' : '#FBE4E2',
                }}
              >
                <Ionicons name="flame" size={18} color={t.colors.rose} />
                <Text
                  style={{
                    color: t.colors.rose,
                    fontSize: 15,
                    fontWeight: '700',
                    letterSpacing: -0.2,
                  }}
                >
                  {streak}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Body */}
        <View style={{ paddingHorizontal: t.spacing.screen, paddingTop: 16 }}>
          {/* Date strip */}
          <DateStrip
            baseDate={today}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            count={7}
          />

          {/* Hero progress card */}
          <Card
            variant="elevated"
            padding={20}
            style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 18 }}
          >
            <Ring size={108} stroke={10} pct={pct}>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: '700',
                  color: t.colors.ink,
                  letterSpacing: -0.7,
                }}
              >
                {pctLabel}
                <Text style={{ fontSize: 12, fontWeight: '500', color: t.colors.ink3 }}>%</Text>
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: t.colors.ink3,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              >
                today
              </Text>
            </Ring>

            <View style={{ flex: 1, gap: 10 }}>
              <View>
                <Text style={{ color: t.colors.ink, fontSize: 17, fontWeight: '600' }}>
                  {completed} of {totalCount} done
                </Text>
                <Text style={{ color: t.colors.ink2, fontSize: 13, marginTop: 2 }}>
                  {totalCount === 0
                    ? 'No habits yet — start with one.'
                    : pct === 1
                    ? 'A perfect day. Keep the streak.'
                    : 'One step closer to a perfect day.'}
                </Text>
              </View>
              <WeekDots />
            </View>
          </Card>

          {/* Section header */}
          {totalCount > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 24,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: t.colors.ink,
                  fontSize: 22,
                  fontWeight: '700',
                  letterSpacing: -0.4,
                }}
              >
                Today's habits
              </Text>
              <Text style={{ color: t.colors.ink3, fontSize: 12, fontWeight: '600' }}>
                {totalCount} total
              </Text>
            </View>
          )}

          {/* Habits */}
          {loading && totalCount === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator color={t.colors.primary} />
            </View>
          ) : totalCount === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 24, paddingHorizontal: 12 }}>
              <View
                style={{
                  width: 200,
                  height: 200,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    width: 140,
                    height: 140,
                    borderRadius: 70,
                    borderWidth: 12,
                    borderColor: t.colors.lineSoft,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    width: 140,
                    height: 140,
                    borderRadius: 70,
                    borderWidth: 12,
                    borderColor: 'transparent',
                    borderTopColor: t.colors.primary,
                    transform: [{ rotate: '45deg' }],
                  }}
                />
                <Text style={{ fontSize: 48 }}>🌱</Text>
              </View>
              <Text
                style={{
                  color: t.colors.ink,
                  fontSize: 22,
                  fontWeight: '700',
                  letterSpacing: -0.4,
                  marginBottom: 8,
                }}
              >
                Plant your first habit
              </Text>
              <Text
                style={{
                  color: t.colors.ink2,
                  fontSize: 14,
                  textAlign: 'center',
                  maxWidth: 280,
                  marginBottom: 20,
                }}
              >
                Habits compound. Start with one small action you can do today —
                even for 30 seconds.
              </Text>
              <Button
                title="Create a habit"
                leftIcon={<Ionicons name="add" size={18} color="#FFFFFF" />}
                onPress={handleCreateHabit}
              />
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {habits.map((habit) => {
                const { current, target, isTimeBased } = computeProgress(habit);
                const partial = !habit.isDoneToday && current > 0 && current < target && (target > 1 || isTimeBased);
                const targetLabel = isTimeBased
                  ? `${target} min`
                  : `${target} ${habit.targetConfig?.unit ?? (target === 1 ? 'time' : 'times')}`;
                const synced = habit.type === 'health' || habit.healthConfig != null;
                return (
                  <HabitRow
                    key={habit.id}
                    emoji={habit.emoji || emojiFor(habit.title || habit.name)}
                    name={habit.title || habit.name || 'Untitled habit'}
                    target={targetLabel}
                    color={habit.color || t.colors.primary}
                    done={current}
                    total={Math.max(target, 1)}
                    partial={partial}
                    synced={synced}
                    onPress={() => handleOpenHabit(habit.id)}
                    onToggle={() => handleToggleHabit(habit)}
                  />
                );
              })}
            </View>
          )}

          {/* AI nudge */}
          {totalCount >= 2 && (
            <Card
              variant="flat"
              padding={16}
              style={{ marginTop: 18, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: t.isDark ? 'rgba(129,140,248,0.18)' : '#E8E6F8',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="sparkles" size={18} color={t.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600', letterSpacing: -0.2 }}
                >
                  Stack your habits for better consistency.
                </Text>
                <Text style={{ color: t.colors.ink2, fontSize: 13, marginTop: 2 }}>
                  Pairing one habit with another is one of the Four Laws.
                </Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>

      <FAB onPress={handleCreateHabit} />
    </Screen>
  );
};
