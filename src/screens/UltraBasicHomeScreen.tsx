import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const UltraBasicHomeScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [habits, setHabits] = useState<any[]>([]);
  const [greeting, setGreeting] = useState('Good day!');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Set dynamic greeting
      const hour = new Date().getHours();
      const greetingText = hour < 12 ? 'Good morning!' : 
                          hour < 18 ? 'Good afternoon!' : 'Good evening!';
      setGreeting(greetingText);
      
      // Load habits from local storage
      const localHabitsStr = await AsyncStorage.getItem('local_habits');
      let habitsData = [];
      
      if (localHabitsStr) {
        habitsData = JSON.parse(localHabitsStr);
      } else {
        // Create default local habits
        habitsData = [
          {
            id: '1',
            title: 'Exercise 30 min',
            description: 'Daily exercise routine',
            currentValue: 0,
            targetValue: 30,
          },
          {
            id: '2',
            title: 'Drink 8 glasses of water',
            description: 'Stay hydrated',
            currentValue: 3,
            targetValue: 8,
          },
        ];
        await AsyncStorage.setItem('local_habits', JSON.stringify(habitsData));
      }
      
      setHabits(habitsData);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      setHabits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHabit = () => {
    // For now, just show alert since we don't have CreateHabit screen
    console.log('Create habit pressed');
  };

  const handleOpenHabit = (habitId: string) => {
    // For now, just show alert since we don't have HabitDetails screen
    console.log('Habit pressed:', habitId);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateProgressPercentage = () => {
    if (habits.length === 0) return 0;
    const completed = habits.filter(habit => 
      habit.currentValue >= habit.targetValue
    ).length;
    return Math.round((completed / habits.length) * 100);
  };

  const renderHabit = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => handleOpenHabit(item.id)}
      >
        <View style={styles.cardContent}>
          <View style={styles.habitInfo}>
            <Text style={styles.habitTitle}>{item.title}</Text>
            <Text style={styles.habitDescription}>{item.description}</Text>
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {item.currentValue}/{item.targetValue}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>{greeting}</Text>
        <Text style={styles.dateText}>{formatDate()}</Text>
      </View>
      
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Today's Progress</Text>
        <Text style={styles.progressPercentage}>{calculateProgressPercentage()}%</Text>
      </View>
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Habits</Text>
        <Text style={styles.sectionSubtitle}>{habits.length}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabit}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />
      
      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleCreateHabit}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#52525B',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#52525B',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 8,
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366F1',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#18181B',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#52525B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    color: '#52525B',
  },
  progressInfo: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
});