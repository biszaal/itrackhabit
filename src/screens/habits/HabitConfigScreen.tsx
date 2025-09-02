import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../../types/navigation';
import { theme } from '../../theme';
import { ColorPicker } from '../../components/neumorphism/ColorPicker';
import { dataService } from '../../services/core';

type HabitConfigScreenProps = RootStackScreenProps<'HabitConfig'>;

const HABIT_COLORS = [
  '#6B9EFF', '#FF6B7A', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43', '#EE5A6F'
];

const TIME_RANGES = ['Anytime', 'Morning', 'Afternoon', 'Evening'];
const GOAL_PERIODS = ['Day-Long', 'Weekly', 'Monthly'];

export const HabitConfigScreen: React.FC<HabitConfigScreenProps> = ({
  navigation,
  route,
}) => {
  const { habitTemplate } = route.params;
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleColorChange = async (selectedColor: string) => {
    try {
      // Update local state
      setHabitData(prev => ({ ...prev, color: selectedColor }));
      
      // Update habit in database
      if (habitTemplate) {
        await dataService.updateHabit(habitTemplate.id, { 
          color: selectedColor,
        });
      }
      
      // Close modal
      setShowColorPicker(false);
    } catch (error) {
      console.error('Failed to update habit color:', error);
      Alert.alert('Error', 'Failed to update habit color. Please try again.');
    }
  };
  
  const [habitData, setHabitData] = useState({
    title: habitTemplate?.title || '',
    description: '',
    color: habitTemplate?.color || '#A8B5A0', // Use habit's color or default to sage
    group: '',
    habitType: 'Build', // Build or Quit
    goalPeriod: 'Day-Long',
    goalValue: 10000,
    goalUnit: 'steps',
    taskDays: 'Every Day',
    timeRange: 'Anytime',
    reminders: true,
    reminderTime: '7:30 pm',
    ringtone: 'Default',
    reminderMessage: '',
  });

  useEffect(() => {
    if (habitTemplate) {
      setHabitData(prev => ({
        ...prev,
        title: habitTemplate.title,
        // Set default values based on habit type
        goalValue: getDefaultGoalValue(habitTemplate.title),
        goalUnit: getDefaultGoalUnit(habitTemplate.title),
      }));
    }
  }, [habitTemplate]);

  const getDefaultGoalValue = (title: string) => {
    const defaults: { [key: string]: number } = {
      'Walk': 10000,
      'Sleep': 8,
      'Run': 30,
      'Workout': 45,
      'Read a book': 30,
      'Meditation': 15,
      'Drink Water': 8,
    };
    return defaults[title] || 1;
  };

  const getDefaultGoalUnit = (title: string) => {
    const units: { [key: string]: string } = {
      'Walk': 'steps',
      'Sleep': 'hours',
      'Run': 'minutes',
      'Workout': 'minutes',
      'Read a book': 'minutes',
      'Meditation': 'minutes',
      'Drink Water': 'glasses',
    };
    return units[title] || 'times';
  };

  const handleSave = async () => {
    try {
      // Save habit logic here
      Alert.alert('Success', 'Habit created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Main', { screen: 'Home' }) }
      ]);
    } catch (error) {
      console.error('Failed to save habit:', error);
      Alert.alert('Error', 'Failed to create habit. Please try again.');
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
      
      <View style={styles.headerContent}>
        <Text style={styles.headerIcon}>{habitTemplate?.icon}</Text>
        <Text style={styles.headerTitle}>{habitData.title}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHabitCard = () => (
    <View style={styles.habitCard}>
      <View style={[styles.habitIconContainer, { backgroundColor: habitData.color }]}>
        <Text style={styles.habitCardIcon}>{habitTemplate?.icon}</Text>
      </View>
      <View style={styles.habitCardContent}>
        <Text style={styles.habitCardTitle}>{habitData.title}</Text>
        <Text style={styles.habitCardDescription}>Description (Optional)</Text>
      </View>
    </View>
  );

  const renderColorSection = () => (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.sectionHeader} 
        onPress={() => setShowColorPicker(true)}
      >
        <Text style={styles.sectionTitle}>Color</Text>
        <View style={[styles.colorPreview, { backgroundColor: habitData.color }]} />
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderGroupSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Group</Text>
        <Text style={styles.sectionValue}>(Optional)</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>
    </View>
  );

  const renderHabitTypeSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Habit Type 
        <Ionicons name="help-circle-outline" size={16} color={theme.colors.textSecondary} />
      </Text>
      <View style={styles.habitTypeContainer}>
        <TouchableOpacity 
          style={[
            styles.habitTypeButton, 
            habitData.habitType === 'Build' && styles.habitTypeButtonActive
          ]}
          onPress={() => setHabitData(prev => ({ ...prev, habitType: 'Build' }))}
        >
          <Text style={[
            styles.habitTypeText,
            habitData.habitType === 'Build' && styles.habitTypeTextActive
          ]}>
            Build
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.habitTypeButton, 
            habitData.habitType === 'Quit' && styles.habitTypeButtonActive
          ]}
          onPress={() => setHabitData(prev => ({ ...prev, habitType: 'Quit' }))}
        >
          <Text style={[
            styles.habitTypeText,
            habitData.habitType === 'Quit' && styles.habitTypeTextActive
          ]}>
            Quit
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGoalPeriodSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Goal Period 
          <Ionicons name="help-circle-outline" size={16} color={theme.colors.textSecondary} />
        </Text>
        <Text style={styles.sectionValue}>{habitData.goalPeriod}</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>
    </View>
  );

  const renderGoalValueSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Goal Value</Text>
        <View style={styles.goalValueContainer}>
          <TextInput
            style={styles.goalValueInput}
            value={habitData.goalValue.toString()}
            onChangeText={(value) => setHabitData(prev => ({ ...prev, goalValue: parseInt(value) || 0 }))}
            keyboardType="numeric"
          />
          <Text style={styles.goalUnit}>{habitData.goalUnit}</Text>
          <Text style={styles.goalPeriod}>/ Day</Text>
        </View>
      </View>
    </View>
  );

  const renderTaskDaysSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Task Days</Text>
        <Text style={styles.sectionValue}>{habitData.taskDays}</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>
      <Text style={styles.goalSummary}>
        *Complete {habitData.goalValue} {habitData.goalUnit} each day
      </Text>
    </View>
  );

  const renderTimeRangeSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Time Range</Text>
      <View style={styles.timeRangeContainer}>
        {TIME_RANGES.map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              habitData.timeRange === range && styles.timeRangeButtonActive
            ]}
            onPress={() => setHabitData(prev => ({ ...prev, timeRange: range }))}
          >
            <Text style={[
              styles.timeRangeText,
              habitData.timeRange === range && styles.timeRangeTextActive
            ]}>
              {range}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRemindersSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Reminders</Text>
        <Switch
          value={habitData.reminders}
          onValueChange={(value) => setHabitData(prev => ({ ...prev, reminders: value }))}
          trackColor={{ false: '#767577', true: '#6B9EFF' }}
          thumbColor={habitData.reminders ? '#fff' : '#f4f3f4'}
        />
      </View>
    </View>
  );

  const renderTimeSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Time</Text>
        <TouchableOpacity style={styles.addTimeButton}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.timeSlot}>
        <Text style={styles.timeSlotText}>{habitData.reminderTime}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRingtoneSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ringtone</Text>
        <Text style={styles.sectionValue}>{habitData.ringtone}</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>
    </View>
  );

  const renderReminderMessageSection = () => (
    <View style={styles.section}>
      <TextInput
        style={styles.reminderMessageInput}
        placeholder="Reminder message"
        value={habitData.reminderMessage}
        onChangeText={(value) => setHabitData(prev => ({ ...prev, reminderMessage: value }))}
        placeholderTextColor={theme.colors.textSecondary}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderHabitCard()}
        {renderColorSection()}
        {renderGroupSection()}
        {renderHabitTypeSection()}
        {renderGoalPeriodSection()}
        {renderGoalValueSection()}
        {renderTaskDaysSection()}
        {renderTimeRangeSection()}
        {renderRemindersSection()}
        {renderTimeSection()}
        {renderRingtoneSection()}
        {renderReminderMessageSection()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Habit Color</Text>
              <TouchableOpacity 
                onPress={() => setShowColorPicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ColorPicker
              selectedColor={habitData.color}
              onColorSelect={handleColorChange}
            />
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#E8F0FE',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  saveButton: {
    backgroundColor: '#6B9EFF',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.subtle,
  },
  habitIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  habitCardIcon: {
    fontSize: 24,
  },
  habitCardContent: {
    flex: 1,
  },
  habitCardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  habitCardDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    flex: 1,
  },
  sectionValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: theme.spacing.sm,
  },
  habitTypeContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  habitTypeButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  habitTypeButtonActive: {
    backgroundColor: '#6B9EFF',
  },
  habitTypeText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  habitTypeTextActive: {
    color: theme.colors.white,
  },
  goalValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalValueInput: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'right',
    minWidth: 60,
  },
  goalUnit: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  goalPeriod: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  goalSummary: {
    fontSize: theme.fontSize.sm,
    color: '#FF9500',
    marginTop: theme.spacing.sm,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  timeRangeButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
  },
  timeRangeButtonActive: {
    backgroundColor: '#6B9EFF',
  },
  timeRangeText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  timeRangeTextActive: {
    color: theme.colors.white,
  },
  addTimeButton: {
    backgroundColor: '#6B9EFF',
    borderRadius: theme.borderRadius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlot: {
    backgroundColor: '#6B9EFF',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  timeSlotText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  reminderMessageInput: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  bottomSpacing: {
    height: theme.spacing.xxl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
});