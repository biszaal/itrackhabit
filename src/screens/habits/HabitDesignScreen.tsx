import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { FourLawsDesigner } from '../../components/FourLawsDesigner';
import { RootStackScreenProps } from '../../types/navigation';
import { dataService } from '../../services/core';
import { Habit } from '../../types';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader } from '../../components/ds';

type HabitDesignScreenProps = RootStackScreenProps<'HabitDesign'>;

export const HabitDesignScreen: React.FC<HabitDesignScreenProps> = ({ navigation, route }) => {
  const t = useTheme();
  const { habitId } = route.params;
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const habits = await dataService.getHabits();
        setHabit(habits.find((h: any) => h.id === habitId) || null);
      } catch {
        Alert.alert('Could not load', 'Try again later.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [habitId, navigation]);

  const handleSave = async () => {
    try {
      await dataService.updateHabit(habitId, { ...habit });
      navigation.goBack();
    } catch {
      Alert.alert('Could not save', 'Try again.');
    }
  };

  return (
    <Screen>
      <AppHeader title="Four Laws designer" subtitle="Cue · Craving · Response · Reward" back onBack={() => navigation.goBack()} />
      {loading || !habit ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      ) : (
        <FourLawsDesigner habit={habit} onSave={handleSave} />
      )}
    </Screen>
  );
};
