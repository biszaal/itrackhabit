import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompoundProgressCard } from '../../components/CompoundProgressCard';
import { RootStackScreenProps } from '../../types/navigation';
import { dataService } from '../../services/core';
import { atomicHabitsService } from '../../services/habits/AtomicHabitsService';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Button } from '../../components/ds';

type CompoundProgressScreenProps = RootStackScreenProps<'CompoundProgress'>;

interface HabitProgressData {
  habit: any;
  progress: any;
  logs: any[];
}

export const CompoundProgressScreen: React.FC<CompoundProgressScreenProps> = ({ navigation }) => {
  const t = useTheme();
  const [data, setData] = useState<HabitProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const habits = await dataService.getHabits();
      const result: HabitProgressData[] = [];
      for (const habit of habits) {
        try {
          const logs: any[] = [];
          if (logs.length >= 3) {
            const progress = atomicHabitsService.calculateCompoundProgress(habit, logs);
            result.push({ habit, progress, logs });
          }
        } catch {}
      }
      result.sort((a, b) => (b.progress.improvementRate ?? 0) - (a.progress.improvementRate ?? 0));
      setData(result);
    } catch {
      Alert.alert('Could not load', 'Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen>
      <AppHeader title="Compound growth" subtitle="Track your 1% improvements" back onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.ink3} />}
          contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 60 }}
        >
          {data.length === 0 ? (
            <Card variant="flat" padding={28} style={{ alignItems: 'center', gap: 10, marginTop: 16 }}>
              <Ionicons name="trending-up" size={48} color={t.colors.primary} />
              <Text style={{ color: t.colors.ink, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>
                Start tracking
              </Text>
              <Text style={{ color: t.colors.ink2, fontSize: 14, textAlign: 'center', maxWidth: 300 }}>
                Complete habits for at least 3 days to see your compound progress analysis.
              </Text>
              <Button title="Back to today" style={{ marginTop: 8 }} onPress={() => navigation.goBack()} />
            </Card>
          ) : (
            <View style={{ gap: 12, marginTop: 16 }}>
              {data.map(({ habit, progress }) => (
                <CompoundProgressCard
                  key={habit.id}
                  progress={progress}
                  title={habit.title}
                  onViewDetails={() => navigation.navigate('HabitDetails', { habitId: habit.id })}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
};
