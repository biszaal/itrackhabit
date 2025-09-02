import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { FourLawsDesigner } from '../../components/FourLawsDesigner';
import { RootStackScreenProps } from '../../types/navigation';
import { dataService } from '../../services/core';
import { Habit } from '../../types';

type HabitDesignScreenProps = RootStackScreenProps<'HabitDesign'>;

export const HabitDesignScreen: React.FC<HabitDesignScreenProps> = ({
  navigation,
  route,
}) => {
  const { habitId } = route.params;
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHabitData();
  }, [habitId]);

  const loadHabitData = async () => {
    try {
      setLoading(true);
      const habits = await dataService.getHabits();
      const habitData = habits.find((h: any) => h.id === habitId);
      setHabit(habitData || null);
    } catch (error) {
      console.error('Error loading habit:', error);
      Alert.alert('Error', 'Failed to load habit data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDesign = async (designData: any) => {
    try {
      // Save the 4 Laws design data to the habit
      await dataService.updateHabit(habitId, {
        ...habit,
        // fourLawsDesign: designData, // TODO: Add this field to Habit interface
      });
      
      Alert.alert(
        'Success',
        'Your habit design has been saved!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving design:', error);
      Alert.alert('Error', 'Failed to save habit design');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
      </SafeAreaView>
    );
  }

  if (!habit) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FourLawsDesigner 
        habit={habit}
        onSave={handleSaveDesign}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});