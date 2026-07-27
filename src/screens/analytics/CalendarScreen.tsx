import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabScreenProps } from '../../types/navigation';
import { dataService } from '../../services/core';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, Card, AppHeader, Chip, useTabBarHeight } from '../../components/ds';
import { toLocalISODate } from '../../utils/formatting/time';

type CalendarScreenProps = MainTabScreenProps<'Calendar'>;

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

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface DayCell {
  date: number;
  iso?: string;
  inMonth: boolean;
  level: number; // 0..4
  isToday?: boolean;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ navigation }) => {
  const t = useTheme();
  const tabBarHeight = useTabBarHeight();
  const [habits, setHabits] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('Overall');
  const [cursor, setCursor] = useState(new Date());
  const [progress, setProgress] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const user = await dataService.getUserData();
      setHabits(user.habits ?? []);

      const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const startISO = toLocalISODate(start);
      const endISO = toLocalISODate(end);
      const daily = await dataService.getDailyStats(startISO, endISO);
      const map = new Map<string, number>();
      daily.forEach((d: any) => map.set(d.date, d.completionRate));
      setProgress(map);
    } catch (e) {
      console.warn('calendar load failed', e);
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const monthGrid = useMemo<DayCell[]>(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const firstDay = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0).getDate();
    // Convert JS Sunday-first to Monday-first
    const offset = (firstDay.getDay() + 6) % 7;
    const cells: DayCell[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < offset; i++) {
      cells.push({ date: 0, inMonth: false, level: 0 });
    }
    for (let d = 1; d <= last; d++) {
      const date = new Date(y, m, d);
      const iso = toLocalISODate(date);
      const pct = progress.get(iso) ?? 0;
      const level = pct === 0 ? 0 : pct < 25 ? 1 : pct < 50 ? 2 : pct < 90 ? 3 : 4;
      cells.push({
        date: d,
        iso,
        inMonth: true,
        level,
        isToday: date.toDateString() === today.toDateString(),
      });
    }
    // Pad to multiple of 7
    while (cells.length % 7 !== 0) cells.push({ date: 0, inMonth: false, level: 0 });
    return cells;
  }, [cursor, progress]);

  const [selectedISO, setSelectedISO] = useState<string | null>(null);
  const selected = selectedISO ? monthGrid.find((c) => c.iso === selectedISO) ?? null : null;

  const activeColor = filter === 'Overall'
    ? t.colors.primary
    : (habits.find((h) => (h.title ?? h.name) === filter)?.color ?? t.colors.primary);

  const levelBg = (lvl: number) =>
    lvl === 0
      ? t.colors.bgPaper
      : lvl === 4
      ? activeColor
      : tint(activeColor, [0.18, 0.4, 0.7][lvl - 1], t.colors.bgPaper);

  const handlePrevMonth = () => {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  };
  const handleToday = () => {
    setCursor(new Date());
  };

  return (
    <Screen>
      <AppHeader
        title="Calendar"
        subtitle={`${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`}
        action={
          // Jump back to the current month — replaces a search affordance that
          // was rendered but never wired to a handler.
          <Pressable
            onPress={handleToday}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go to current month"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: t.colors.bgPaper,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="today-outline" size={18} color={t.colors.ink2} />
          </Pressable>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: tabBarHeight + 24 }}>
        {/* Habit filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          <Chip label="● Overall" active={filter === 'Overall'} onPress={() => setFilter('Overall')} />
          {habits.slice(0, 8).map((h) => {
            const name = h.title ?? h.name;
            return (
              <Chip
                key={h.id}
                label={`${h.emoji || '🎯'} ${name}`}
                active={filter === name}
                onPress={() => setFilter(name)}
                color={h.color || t.colors.primary}
              />
            );
          })}
        </ScrollView>

        {/* Month nav */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 12 }}>
          <Pressable
            onPress={handlePrevMonth}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: t.colors.bgPaper,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={14} color={t.colors.ink2} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.colors.ink, letterSpacing: -0.3 }}>
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </Text>
          <Pressable
            onPress={handleNextMonth}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: t.colors.bgPaper,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-forward" size={14} color={t.colors.ink2} />
          </Pressable>
        </View>

        {/* Day-of-week */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
          {DOW.map((d, i) => (
            <Text
              key={i}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 11,
                fontWeight: '700',
                color: t.colors.ink3,
                letterSpacing: 0.8,
              }}
            >
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View>
          {Array.from({ length: Math.ceil(monthGrid.length / 7) }).map((_, r) => (
            <View key={r} style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
              {monthGrid.slice(r * 7, r * 7 + 7).map((cell, i) => {
                if (!cell.inMonth) {
                  return <View key={i} style={{ flex: 1, aspectRatio: 1 }} />;
                }
                const bg = levelBg(cell.level);
                const fg = cell.level >= 3 ? '#FFFFFF' : t.colors.ink;
                return (
                  <Pressable
                    key={i}
                    onPress={() => setSelectedISO(cell.iso ?? null)}
                    accessibilityRole="button"
                    accessibilityLabel={`${cell.date}${cell.isToday ? ', today' : ''}`}
                    accessibilityState={{ selected: selectedISO === cell.iso }}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      borderRadius: 10,
                      backgroundColor: bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: cell.isToday ? 2 : 0,
                      borderColor: t.colors.ink,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: cell.isToday ? '700' : '500', color: fg }}>
                      {cell.date}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {loading && (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator color={t.colors.primary} />
          </View>
        )}

        {/* Day detail */}
        {selected && (
          <Card variant="elevated" padding={18} style={{ marginTop: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
              <View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: t.colors.ink3,
                    textTransform: 'uppercase',
                    letterSpacing: 0.7,
                  }}
                >
                  {new Date(selected.iso!).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: t.colors.ink, marginTop: 2, letterSpacing: -0.4 }}>
                  {Math.round((progress.get(selected.iso!) ?? 0))}% complete
                </Text>
              </View>
              <Chip
                label={`${Math.round(progress.get(selected.iso!) ?? 0)}%`}
                color={t.colors.success}
                style={{ backgroundColor: tint(t.colors.success, 0.14, t.colors.bgPaper) }}
              />
            </View>
            {habits.length === 0 && (
              <Text style={{ color: t.colors.ink3, fontSize: 13 }}>
                No habits yet. Create one to start tracking your days.
              </Text>
            )}
            {habits.slice(0, 6).map((h, i) => {
              const c = h.color || t.colors.primary;
              const name = h.title ?? h.name ?? 'Untitled';
              return (
                <View
                  key={h.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingVertical: 10,
                    borderTopWidth: i ? 1 : 0,
                    borderTopColor: t.colors.lineSoft,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: tint(c, 0.14, t.colors.bgPaper),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{h.emoji || '🎯'}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: t.colors.ink }} numberOfLines={1}>
                    {name}
                  </Text>
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      backgroundColor: h.isDoneToday ? c : 'transparent',
                      borderWidth: h.isDoneToday ? 0 : 1.5,
                      borderColor: t.colors.line,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {h.isDoneToday && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                  </View>
                </View>
              );
            })}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
};
