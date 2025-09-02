import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../../types/navigation';
import { theme } from '../../theme';
import { NeumorphCard, NeumorphButton, NeumorphInput, ColorPicker, NeumorphismColors, createNeumorphismStyle } from '../../components/neumorphism';
import { dataService } from '../../services/core';
import { Habit } from '../../types';

type HabitEditScreenProps = RootStackScreenProps<'HabitEdit'>;

export const HabitEditScreen: React.FC<HabitEditScreenProps> = ({
  navigation,
  route,
}) => {
  const { habit: initialHabit } = route.params;
  
  
  const [habit, setHabit] = useState<Habit>(initialHabit);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!habit.title.trim()) {
      Alert.alert('Error', 'Please enter a habit title');
      return;
    }


    setIsLoading(true);
    try {
      // Ensure DataService is initialized
      await dataService.initialize();
      
      const updatedHabit = await dataService.updateHabit(habit.id, {
        title: habit.title,
        notes: habit.notes,
        color: habit.color,
        targetConfig: habit.targetConfig,
      });
      
      
      Alert.alert('Success', 'Habit updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('❌ Failed to update habit:', error);
      Alert.alert('Error', `Failed to update habit: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorChange = (selectedColor: string) => {
    setHabit(prev => ({ ...prev, color: selectedColor }));
    setShowColorPicker(false);
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Habit',
      `Delete "${habit.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await dataService.initialize();
              await dataService.deleteHabit(habit.id);
              navigation.navigate('Main', { screen: 'Home' });
            } catch (error) {
              console.error('❌ Failed to delete habit:', error);
              Alert.alert('Error', 'Failed to delete habit. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderHeader = () => (
    <NeumorphCard variant="subtle" style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Edit Habit</Text>
      <NeumorphButton
        title="Save"
        onPress={handleSave}
        variant="primary"
        size="small"
        style={styles.saveButton}
      />
    </NeumorphCard>
  );

  const renderHabitPreview = () => (
    <NeumorphCard variant="convex" style={styles.previewCard}>
      <View style={styles.previewContainer}>
        <View style={[styles.colorIndicator, { backgroundColor: habit.color || '#A8B5A0' }]} />
        <View style={styles.previewInfo}>
          <Text style={styles.previewTitle}>{habit.title || 'Habit Name'}</Text>
          <Text style={styles.previewSubtitle}>
            {habit.targetConfig?.targetValue 
              ? `${habit.targetConfig.targetValue} ${habit.targetConfig.unit || 'times'}`
              : 'No target set'
            }
          </Text>
        </View>
      </View>
    </NeumorphCard>
  );

  const renderBasicInfo = () => (
    <NeumorphCard variant="convex" style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Habit Name</Text>
        <NeumorphInput
          value={habit.title}
          onChangeText={(text: string) => setHabit(prev => ({ ...prev, title: text }))}
          placeholder="Enter habit name"
          style={styles.textInput}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Notes (Optional)</Text>
        <NeumorphInput
          value={habit.notes || ''}
          onChangeText={(text: string) => setHabit(prev => ({ ...prev, notes: text }))}
          placeholder="Add notes about this habit"
          multiline
          numberOfLines={3}
          style={[styles.textInput, styles.multilineInput]}
        />
      </View>
    </NeumorphCard>
  );

  const renderColorSection = () => (
    <NeumorphCard variant="convex" style={styles.section}>
      <Text style={styles.sectionTitle}>Appearance</Text>
      
      <TouchableOpacity 
        style={styles.colorRow}
        onPress={() => setShowColorPicker(true)}
      >
        <View style={styles.colorInfo}>
          <Text style={styles.colorLabel}>Habit Color</Text>
          <Text style={styles.colorSubtext}>Customize your habit's color</Text>
        </View>
        <View style={[styles.colorPreview, { backgroundColor: habit.color || '#A8B5A0' }]} />
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </NeumorphCard>
  );

  const renderTargetSection = () => (
    <NeumorphCard variant="convex" style={styles.section}>
      <Text style={styles.sectionTitle}>Target Settings</Text>
      
      <View style={styles.targetRow}>
        <View style={styles.targetInput}>
          <Text style={styles.inputLabel}>Target Value</Text>
          <NeumorphInput
            value={habit.targetConfig?.targetValue?.toString() || ''}
            onChangeText={(text: string) => {
              const value = parseInt(text) || 0;
              setHabit(prev => ({
                ...prev,
                targetConfig: {
                  ...prev.targetConfig,
                  hasTarget: true,
                  targetValue: value,
                }
              }));
            }}
            placeholder="0"
            keyboardType="numeric"
            style={styles.smallInput}
          />
        </View>
        
        <View style={styles.targetInput}>
          <Text style={styles.inputLabel}>Unit</Text>
          <NeumorphInput
            value={habit.targetConfig?.unit || ''}
            onChangeText={(text: string) => {
              setHabit(prev => ({
                ...prev,
                targetConfig: {
                  ...prev.targetConfig,
                  hasTarget: true,
                  unit: text,
                }
              }));
            }}
            placeholder="minutes"
            style={styles.smallInput}
          />
        </View>
      </View>
    </NeumorphCard>
  );

  const renderDeleteSection = () => (
    <NeumorphCard variant="convex" style={styles.section}>
      <NeumorphButton
        title="Delete Habit"
        onPress={handleDelete}
        variant="primary"
        size="medium"
        style={styles.deleteButton}
      />
    </NeumorphCard>
  );

  const renderColorPicker = () => {
    if (!showColorPicker) return null;
    
    return (
      <View style={styles.colorPickerOverlay}>
        <View style={styles.colorPickerContainer}>
          <View style={styles.colorPickerHeader}>
            <Text style={styles.colorPickerTitle}>Choose Habit Color</Text>
            <TouchableOpacity 
              onPress={() => setShowColorPicker(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ColorPicker
            selectedColor={habit.color || '#A8B5A0'}
            onColorSelect={handleColorChange}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderHabitPreview()}
          {renderBasicInfo()}
          {renderColorSection()}
          {renderTargetSection()}
          {renderDeleteSection()}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {renderColorPicker()}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NeumorphismColors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: NeumorphismColors.background,
    borderBottomWidth: 1,
    borderBottomColor: NeumorphismColors.primary,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  previewCard: {
    marginVertical: theme.spacing.lg,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  colorIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: theme.spacing.md,
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  previewSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    fontSize: theme.fontSize.md,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  colorInfo: {
    flex: 1,
  },
  colorLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  colorSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: theme.spacing.sm,
  },
  targetRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  targetInput: {
    flex: 1,
  },
  smallInput: {
    fontSize: theme.fontSize.md,
  },
  bottomSpacing: {
    height: theme.spacing.xxl,
  },
  colorPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  colorPickerContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: NeumorphismColors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    maxHeight: '80%',
    ...createNeumorphismStyle('convex', 'large', NeumorphismColors.surface),
  },
  colorPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  colorPickerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  deleteButton: {
    alignSelf: 'stretch',
  },
});