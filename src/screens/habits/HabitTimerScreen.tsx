import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackScreenProps } from '../../types/navigation';
import { Habit } from '../../types';
import { dataService } from '../../services/core';
import { timerService } from '../../services/habits/TimerService';
import { useTheme } from '../../theme/ThemeContext';
import { Screen } from '../../components/ds';

type HabitTimerScreenProps = RootStackScreenProps<'HabitTimer'>;

const RADIUS = 140;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const fmt = (s: number): string => {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const emojiFor = (title: string): string => {
  const t = (title || '').toLowerCase();
  if (t.includes('meditat')) return '🧘';
  if (t.includes('run')) return '🏃';
  if (t.includes('read')) return '📚';
  if (t.includes('write') || t.includes('journal')) return '✍️';
  return '🎯';
};

export const HabitTimerScreen: React.FC<HabitTimerScreenProps> = ({ navigation, route }) => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { habitId } = route.params;

  const [habit, setHabit] = useState<Habit | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [targetTime, setTargetTime] = useState(30 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const loadHabit = useCallback(async () => {
    try {
      const data = await dataService.getHabitById?.(habitId);
      if (data) {
        setHabit(data);
        const target = (data.targetConfig?.isTimeBased ? data.targetConfig?.targetValue : null) ?? 30;
        setTargetTime(target * 60);
      }
    } catch {}
  }, [habitId]);

  useEffect(() => { loadHabit(); }, [loadHabit]);
  useFocusEffect(useCallback(() => { loadHabit(); }, [loadHabit]));

  useEffect(() => {
    const handle = (g: any) => {
      if (!g) return;
      setCurrentTime(g.currentTime);
      setIsRunning(g.isRunning);
      setIsPaused(g.isPaused);
    };
    const existing = timerService.getTimer(habitId);
    if (existing) handle(existing);

    timerService.addListener?.(habitId, handle);
    return () => {
      timerService.removeListener?.(habitId, handle);
    };
  }, [habitId]);

  useEffect(() => {
    navigation.setOptions?.({ headerShown: false });
  }, [navigation]);

  const handleStart = async () => {
    try {
      await timerService.startTimer(habitId, targetTime);
    } catch (e) {
      Alert.alert('Could not start', 'Please try again.');
    }
  };

  const handlePause = async () => {
    await timerService.pauseTimer(habitId);
  };

  const handleReset = async () => {
    await timerService.resetTimer(habitId);
    setCurrentTime(0);
  };

  const handleComplete = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await dataService.markHabitProgress(habitId, today, 'done', {
        currentValue: Math.floor(targetTime / 60),
        targetValue: Math.floor(targetTime / 60),
        unit: 'minutes',
        timeSpentSeconds: currentTime,
      });
      await timerService.resetTimer(habitId);
      Alert.alert('Nice work', 'Session marked complete.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Could not save', 'Try again.');
    }
  };

  const remaining = Math.max(0, targetTime - currentTime);
  const pct = targetTime > 0 ? currentTime / targetTime : 0;
  const accent = habit?.color || t.colors.primary;

  const ambientBg = t.isDark ? '#0e0f1a' : t.colors.bg;
  const overlayText = t.isDark ? 'rgba(255,255,255,0.55)' : t.colors.ink2;

  return (
    <Screen background={ambientBg}>
      {/* Ambient gradient (faked with translucent radial-ish overlay) */}
      <View
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          right: '10%',
          height: 320,
          borderRadius: 200,
          backgroundColor: accent,
          opacity: 0.15,
        }}
      />

      <View style={{ flex: 1, paddingTop: insets.top + 12, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : t.colors.bgPaper,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={20} color={t.isDark ? '#FFFFFF' : t.colors.ink} />
          </Pressable>
          <Text style={{ color: overlayText, fontSize: 14 }}>Focus mode</Text>
          <Pressable
            onPress={() => navigation.navigate('HabitDetails', { habitId })}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : t.colors.bgPaper,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={t.isDark ? '#FFFFFF' : t.colors.ink2} />
          </Pressable>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 36, marginBottom: 4 }}>{habit?.emoji || emojiFor(habit?.title ?? '')}</Text>
            <Text style={{ color: t.isDark ? '#FFFFFF' : t.colors.ink, fontSize: 20, fontWeight: '600' }}>
              {habit?.title || 'Focus session'}
            </Text>
            <Text style={{ color: overlayText, fontSize: 13, marginTop: 2 }}>
              Target · {Math.floor(targetTime / 60)} minutes
            </Text>
          </View>

          {/* Big ring */}
          <View style={{ width: 300, height: 300, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={300} height={300} style={{ position: 'absolute' }}>
              <Circle
                cx={150}
                cy={150}
                r={RADIUS}
                stroke={t.isDark ? 'rgba(255,255,255,0.08)' : t.colors.bgPaper}
                strokeWidth={8}
                fill="none"
              />
              <Circle
                cx={150}
                cy={150}
                r={RADIUS}
                stroke={accent}
                strokeWidth={8}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                strokeDashoffset={CIRCUMFERENCE * (1 - Math.min(1, pct))}
                transform={`rotate(-90, 150, 150)`}
              />
            </Svg>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text
                style={{
                  color: t.isDark ? '#FFFFFF' : t.colors.ink,
                  fontSize: 72,
                  fontWeight: '700',
                  letterSpacing: -2,
                }}
              >
                {fmt(remaining)}
              </Text>
              <Text
                style={{
                  color: overlayText,
                  fontSize: 12,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                }}
              >
                Remaining
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: overlayText,
              fontSize: 13,
              textAlign: 'center',
              maxWidth: 280,
              fontStyle: 'italic',
            }}
          >
            "Settle in. Notice the breath without changing it."
          </Text>
        </View>

        {/* Controls */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <Pressable
            onPress={handleReset}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : t.colors.bgPaper,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="stop" size={22} color={t.isDark ? '#FFFFFF' : t.colors.ink} />
          </Pressable>

          <Pressable
            onPress={isRunning ? handlePause : handleStart}
            style={[
              {
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: accent,
                alignItems: 'center',
                justifyContent: 'center',
              },
              {
                shadowColor: accent,
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.5,
                shadowRadius: 32,
                elevation: 12,
              },
            ]}
          >
            <Ionicons name={isRunning ? 'pause' : 'play'} size={32} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={handleComplete}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : t.colors.bgPaper,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="checkmark" size={22} color={t.isDark ? '#FFFFFF' : t.colors.ink} />
          </Pressable>
        </View>
      </View>
    </Screen>
  );
};
