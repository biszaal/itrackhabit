import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../../types/navigation';
import { dataService } from '../../services/core';
import { HabitWithStats } from '../../types';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button } from '../../components/ds';

type Props = RootStackScreenProps<'HabitNotificationHabits'>;

// Reminder settings are stored per habit, so this picker stands between the
// Profile row and the settings screen, which needs a habitId to load anything.
export const HabitNotificationHabitsScreen: React.FC<Props> = ({ navigation }) => {
  const t = useTheme();
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<HabitWithStats[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await dataService.initialize();
      setHabits(await dataService.getHabitsWithStats());
    } catch {
      setHabits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  return (
    <Screen>
      <AppHeader
        title="Smart notifications"
        subtitle="Choose a habit to set reminders for."
        back
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      ) : habits.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
          <Text style={{ color: t.colors.ink2, textAlign: 'center' }}>
            You have no habits yet. Create one to set up reminders.
          </Text>
          <Button title="Create a habit" onPress={() => navigation.navigate('HabitTemplates')} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 60 }}
        >
          <Card variant="elevated" padding={0}>
            {habits.map((habit, i) => (
              <Pressable
                key={habit.id}
                accessibilityRole="button"
                accessibilityLabel={`Notification settings for ${habit.title}`}
                onPress={() => navigation.navigate('HabitNotificationSettings', { habitId: habit.id })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: i < habits.length - 1 ? 1 : 0,
                  borderBottomColor: t.colors.lineSoft,
                  gap: 12,
                }}
              >
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
                  <Text style={{ fontSize: 16 }}>{habit.emoji ?? '🔔'}</Text>
                </View>
                <Text style={{ color: t.colors.ink, fontSize: 15, fontWeight: '600', flex: 1 }}>
                  {habit.title}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={t.colors.ink3} />
              </Pressable>
            ))}
          </Card>
        </ScrollView>
      )}
    </Screen>
  );
};

export default HabitNotificationHabitsScreen;
