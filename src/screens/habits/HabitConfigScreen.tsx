import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../../types/navigation';
import { dataService } from '../../services/core';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button, Field } from '../../components/ds';

type HabitConfigScreenProps = RootStackScreenProps<'HabitConfig'>;

const HABIT_TYPES = ['Build', 'Quit'];
const GOAL_PERIODS = ['Day-Long', 'Weekly', 'Monthly'];

const defaultGoalValue = (title: string): number => {
  const v: Record<string, number> = {
    Walk: 10000,
    Sleep: 8,
    Run: 30,
    Workout: 45,
    'Read a book': 30,
    Meditation: 15,
    'Drink Water': 8,
  };
  return v[title] ?? 1;
};
const defaultGoalUnit = (title: string): string => {
  const u: Record<string, string> = {
    Walk: 'steps',
    Sleep: 'hours',
    Run: 'minutes',
    Workout: 'minutes',
    'Read a book': 'minutes',
    Meditation: 'minutes',
    'Drink Water': 'glasses',
  };
  return u[title] ?? 'times';
};

export const HabitConfigScreen: React.FC<HabitConfigScreenProps> = ({ navigation, route }) => {
  const t = useTheme();
  const { habitTemplate } = route.params;

  const [habit, setHabit] = useState({
    title: habitTemplate?.title || '',
    color: habitTemplate?.color || t.habitColors[0],
    habitType: 'Build',
    goalPeriod: 'Day-Long',
    goalValue: defaultGoalValue(habitTemplate?.title || ''),
    goalUnit: defaultGoalUnit(habitTemplate?.title || ''),
    reminders: true,
    reminderTime: '7:30 pm',
    reminderMessage: '',
  });

  useEffect(() => {
    if (habitTemplate?.title) {
      setHabit((h) => ({
        ...h,
        title: habitTemplate.title,
        goalValue: defaultGoalValue(habitTemplate.title),
        goalUnit: defaultGoalUnit(habitTemplate.title),
      }));
    }
  }, [habitTemplate]);

  const handleSave = async () => {
    try {
      await dataService.createHabit({
        title: habit.title,
        frequency: habit.goalPeriod === 'Weekly' ? 'weekly' : 'daily',
        type: 'manual',
        color: habit.color,
        targetConfig: { hasTarget: true, targetValue: habit.goalValue, unit: habit.goalUnit, isTimeBased: habit.goalUnit === 'minutes' },
      });
      Alert.alert('Created', 'Habit added!', [
        { text: 'OK', onPress: () => navigation.navigate('Main' as any, { screen: 'Home', params: {} }) },
      ]);
    } catch {
      Alert.alert('Could not save', 'Try again.');
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <AppHeader
          title={habit.title}
          large={false}
          back
          onBack={() => navigation.goBack()}
          action={
            <Pressable onPress={handleSave} hitSlop={8}>
              <Text style={{ color: t.colors.primary, fontSize: 14, fontWeight: '700' }}>Save</Text>
            </Pressable>
          }
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 120, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={lblStyle(t)}>Habit type</Text>
          <View style={{ flexDirection: 'row', padding: 4, gap: 4, backgroundColor: t.colors.bgPaper, borderRadius: 14 }}>
            {HABIT_TYPES.map((opt) => {
              const active = habit.habitType === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => setHabit({ ...habit, habitType: opt })}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: active ? t.colors.bgElev : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: active ? t.colors.ink : t.colors.ink2 }}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={lblStyle(t)}>Goal period</Text>
          <View style={{ flexDirection: 'row', padding: 4, gap: 4, backgroundColor: t.colors.bgPaper, borderRadius: 14 }}>
            {GOAL_PERIODS.map((opt) => {
              const active = habit.goalPeriod === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => setHabit({ ...habit, goalPeriod: opt })}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: active ? t.colors.bgElev : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: active ? t.colors.ink : t.colors.ink2 }}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={lblStyle(t)}>Goal</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Field
                value={String(habit.goalValue)}
                onChangeText={(v) => setHabit({ ...habit, goalValue: Number(v) || 0 })}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field value={habit.goalUnit} onChangeText={(v) => setHabit({ ...habit, goalUnit: v })} />
            </View>
          </View>

          {/* Reminders */}
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
              <Ionicons name="notifications-outline" size={18} color={t.colors.ink2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.colors.ink, fontSize: 14, fontWeight: '600' }}>Reminders</Text>
              <Text style={{ color: t.colors.ink3, fontSize: 12 }}>Daily nudge at {habit.reminderTime}</Text>
            </View>
            <Switch
              value={habit.reminders}
              onValueChange={(v) => setHabit({ ...habit, reminders: v })}
              trackColor={{ true: t.colors.primary, false: t.colors.line }}
            />
          </Card>

          <Button title="Create habit" onPress={handleSave} fullWidth style={{ marginTop: 16 }} />
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
