import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components';
import { FrequencyType, Habit, HabitType, HealthMetricType, HealthHabitConfig, User } from '../types';
import { RootStackScreenProps } from '../types/navigation';
import { healthService } from '../services/HealthService';
import { dataService } from '../services/DataService';
import { habitTemplatesService } from '../services/HabitTemplatesService';
import { authService } from '../services/AuthService';
import { premiumService } from '../services/PremiumService';
import { atomicHabitsService, IdentityStatement } from '../services/AtomicHabitsService';
import { theme } from '../theme';

type CreateEditHabitScreenProps = 
  | RootStackScreenProps<'CreateHabit'> 
  | RootStackScreenProps<'EditHabit'>;

const frequencyOptions: { label: string; value: FrequencyType }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Custom', value: 'custom' },
];

export const CreateEditHabitScreen: React.FC<CreateEditHabitScreenProps> = ({
  navigation,
  route,
}) => {
  const isEditing = 'habitId' in route.params && route.params.habitId;
  const habitId = isEditing ? route.params.habitId : null;

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [isShared, setIsShared] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [microSteps, setMicroSteps] = useState<string[]>(['']);
  const [enableMicroSteps, setEnableMicroSteps] = useState(false);
  const [loading, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentHabitCount, setCurrentHabitCount] = useState(0);
  
  // Atomic Habits states
  const [identityStatements, setIdentityStatements] = useState<IdentityStatement[]>([]);
  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null);
  const [showIdentityCreation, setShowIdentityCreation] = useState(false);
  const [newIdentityCategory, setNewIdentityCategory] = useState<string>('');
  
  // Health-specific states
  const [habitType, setHabitType] = useState<HabitType>('manual');
  const [healthConfig, setHealthConfig] = useState<HealthHabitConfig>({
    metricType: 'steps',
    targetValue: 10000,
    unit: 'steps',
    autoTrack: true,
  });
  const [healthIntegrationAvailable, setHealthIntegrationAvailable] = useState(false);

  useEffect(() => {
    loadTemplateData();
    loadUserData();
    loadIdentityData();
    
    if (isEditing) {
      // TODO: Load habit data
      setTitle('Example Habit');
      setNotes('Example notes');
      setFrequency('daily');
      setIsShared(false);
    }
    
    // Check if creating health habit from route params
    if (route.params && 'type' in route.params && route.params.type === 'health') {
      setHabitType('health');
    }
  }, [isEditing, habitId, route.params]);

  const loadUserData = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      
      if (user) {
        const habits = await dataService.getHabits();
        setCurrentHabitCount(habits.length);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadIdentityData = async () => {
    try {
      const identities = await atomicHabitsService.getIdentityStatements();
      setIdentityStatements(identities);
    } catch (error) {
      console.error('Error loading identity data:', error);
    }
  };

  const loadTemplateData = () => {
    // Define categories with coral/pink theme
    const categoriesData = [
      { id: 'health', icon: '🔥', color: '#FF6B7A', name: 'Health' },
      { id: 'fitness', icon: '❤️', color: '#FF6B7A', name: 'Fitness' },
      { id: 'wellness', icon: '🏃', color: '#FF6B7A', name: 'Wellness' },
      { id: 'home', icon: '🏠', color: '#FF6B7A', name: 'Home' },
      { id: 'time', icon: '🕒', color: '#FF6B7A', name: 'Time' },
      { id: 'quit', icon: '🚫', color: '#FF6B7A', name: 'Quit' },
    ];
    setCategories(categoriesData);
    
    // Define popular habits
    const popularHabits = [
      { id: 1, icon: '🚶', title: 'Walk', isFavorite: true },
      { id: 2, icon: '🛏️', title: 'Sleep', isFavorite: true },
      { id: 3, icon: '🏃', title: 'Run', isFavorite: false },
      { id: 4, icon: '🧍', title: 'Stand', isFavorite: true },
      { id: 5, icon: '🚴', title: 'Cycling', isFavorite: true },
      { id: 6, icon: '💪', title: 'Workout', isFavorite: true },
      { id: 7, icon: '🔥', title: 'Active Calorie', isFavorite: true },
      { id: 8, icon: '🔥', title: 'Burn Calorie', isFavorite: true },
      { id: 9, icon: '🏃', title: 'Exercise', isFavorite: true },
      { id: 10, icon: '🧘', title: 'Meditation', isFavorite: true },
      { id: 11, icon: '📚', title: 'Read a book', isFavorite: false },
    ];
    setTemplates(popularHabits);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const categoryTemplates = habitTemplatesService.getTemplatesByCategory(categoryId);
    setTemplates(categoryTemplates);
  };

  const handleTemplateSelect = (template: any) => {
    // Navigate to habit configuration screen
    navigation.navigate('HabitConfig', { habitTemplate: template });
  };
  
  const toggleFavorite = (templateId: number) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, isFavorite: !template.isFavorite }
        : template
    ));
  };

  useEffect(() => {
    // Check health integration availability
    const checkHealthIntegration = async () => {
      try {
        const status = await healthService.initialize();
        setHealthIntegrationAvailable(status.isAvailable && status.isAuthorized);
      } catch (error) {
        console.error('Health integration check failed:', error);
        setHealthIntegrationAvailable(false);
      }
    };
    
    checkHealthIntegration();
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a habit title');
      return;
    }

    // Check habit limits for new habits
    if (!isEditing && currentUser) {
      const canAdd = premiumService.canAddHabit(currentUser, currentHabitCount);
      
      if (!canAdd) {
        const upgradeMessage = premiumService.getUpgradePromptMessage(currentUser, currentHabitCount);
        Alert.alert(
          'Habit Limit Reached',
          upgradeMessage,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Upgrade', 
              onPress: () => navigation.navigate('Premium' as any)
            }
          ]
        );
        return;
      }
    }

    setSaving(true);
    try {
      if (isEditing && habitId) {
        // Update existing habit
        await dataService.updateHabit(habitId, {
          title: title.trim(),
          notes: notes.trim() || undefined,
          frequency,
          isShared,
          type: habitType,
          healthConfig: habitType === 'health' ? healthConfig : undefined,
        });
      } else {
        // Create new habit
        const newHabit = await dataService.createHabit({
          title: title.trim(),
          notes: notes.trim() || undefined,
          frequency,
          isShared,
          type: habitType,
          healthConfig: habitType === 'health' ? healthConfig : undefined,
        });
        
        // Link habit to selected identity if one was chosen
        if (selectedIdentity && newHabit.id) {
          await atomicHabitsService.linkHabitToIdentity(newHabit.id, selectedIdentity);
        }
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save habit:', error);
      Alert.alert('Error', 'Failed to save habit');
    } finally {
      setSaving(false);
    }
  }, [isEditing, habitId, title, notes, frequency, isShared, habitType, healthConfig, navigation]);

  const addMicroStep = () => {
    setMicroSteps([...microSteps, '']);
  };

  const removeMicroStep = (index: number) => {
    setMicroSteps(microSteps.filter((_, i) => i !== index));
  };

  const updateMicroStep = (index: number, value: string) => {
    const updated = [...microSteps];
    updated[index] = value;
    setMicroSteps(updated);
  };

  const renderFrequencySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Frequency</Text>
      <View style={styles.frequencyContainer}>
        {frequencyOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.frequencyOption,
              frequency === option.value && styles.frequencyOptionSelected,
            ]}
            onPress={() => setFrequency(option.value)}
          >
            <Text
              style={[
                styles.frequencyOptionText,
                frequency === option.value && styles.frequencyOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMicroSteps = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Break into micro-steps</Text>
        <Switch
          value={enableMicroSteps}
          onValueChange={setEnableMicroSteps}
          trackColor={{ false: '#767577', true: '#2196F3' }}
          thumbColor={enableMicroSteps ? '#fff' : '#f4f3f4'}
        />
      </View>
      
      {enableMicroSteps && (
        <View style={styles.microStepsContainer}>
          <Text style={styles.microStepsDescription}>
            Break your habit into smaller, actionable steps
          </Text>
          
          {microSteps.map((step, index) => (
            <View key={index} style={styles.microStepRow}>
              <TextInput
                style={styles.microStepInput}
                placeholder={`Step ${index + 1}`}
                value={step}
                onChangeText={(value) => updateMicroStep(index, value)}
                multiline
              />
              {microSteps.length > 1 && (
                <TouchableOpacity
                  style={styles.removeMicroStepButton}
                  onPress={() => removeMicroStep(index)}
                >
                  <Ionicons name="close-circle" size={20} color="#f44336" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          <TouchableOpacity style={styles.addMicroStepButton} onPress={addMicroStep}>
            <Ionicons name="add" size={16} color="#2196F3" />
            <Text style={styles.addMicroStepText}>Add step</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>New Habit</Text>
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSave}
        disabled={!title.trim()}
      >
        <Text style={[styles.saveButtonText, !title.trim() && styles.saveButtonDisabled]}>
          Save
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categoriesSection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScrollContent}>
        {categories.map((category, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.categoryButton}
            onPress={() => handleCategorySelect(category.id)}
          >
            <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
              <Text style={styles.categoryEmoji}>{category.icon}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPopularSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Popular</Text>
      <Text style={styles.sectionSubtitle}>Most popular habits</Text>
      
      {templates.map((template, index) => (
        <TouchableOpacity 
          key={template.id} 
          style={styles.templateItem}
          onPress={() => handleTemplateSelect(template)}
        >
          <Text style={styles.templateIcon}>{template.icon}</Text>
          <Text style={styles.templateTitle}>{template.title}</Text>
          <View style={styles.templateActions}>
            <TouchableOpacity 
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(template.id)}
            >
              <Ionicons 
                name={template.isFavorite ? "heart" : "heart-outline"} 
                size={20} 
                color={template.isFavorite ? '#FF6B7A' : theme.colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => handleTemplateSelect(template)}
            >
              <Ionicons name="add" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const handleCreateIdentity = async (category: string) => {
    try {
      const goals = []; // Could be expanded to capture user goals
      const newIdentity = await atomicHabitsService.createIdentityStatement(category, goals);
      setIdentityStatements(prev => [...prev, newIdentity]);
      setSelectedIdentity(newIdentity.id);
      setShowIdentityCreation(false);
    } catch (error) {
      console.error('Error creating identity:', error);
      Alert.alert('Error', 'Failed to create identity statement');
    }
  };

  const renderIdentitySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Who do you want to become?</Text>
      <Text style={styles.sectionSubtitle}>
        Identity-based habits are more powerful than outcome-based habits
      </Text>
      
      {identityStatements.length > 0 && (
        <View style={styles.identityList}>
          {identityStatements.map((identity) => (
            <TouchableOpacity
              key={identity.id}
              style={[
                styles.identityOption,
                selectedIdentity === identity.id && styles.identityOptionSelected,
              ]}
              onPress={() => setSelectedIdentity(identity.id)}
            >
              <View style={styles.identityContent}>
                <Text style={[
                  styles.identityText,
                  selectedIdentity === identity.id && styles.identityTextSelected,
                ]}>
                  {identity.statement}
                </Text>
                <Text style={styles.identityCategory}>
                  {identity.category.toUpperCase()}
                </Text>
              </View>
              {selectedIdentity === identity.id && (
                <Ionicons name="checkmark-circle" size={20} color="#FF6B7A" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.createIdentityButton}
        onPress={() => setShowIdentityCreation(true)}
      >
        <Ionicons name="add" size={16} color="#FF6B7A" />
        <Text style={styles.createIdentityText}>Create Identity Statement</Text>
      </TouchableOpacity>
      
      {showIdentityCreation && (
        <View style={styles.identityCreationModal}>
          <Text style={styles.modalTitle}>Choose your identity focus:</Text>
          <View style={styles.identityCategories}>
            {['health', 'productivity', 'learning', 'relationships', 'personal'].map((category) => (
              <TouchableOpacity
                key={category}
                style={styles.identityCategoryButton}
                onPress={() => handleCreateIdentity(category)}
              >
                <Text style={styles.identityCategoryText}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => setShowIdentityCreation(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderCustomHabitButton = () => (
    <TouchableOpacity 
      style={styles.customHabitButton}
      onPress={() => navigation.navigate('CreateHabit', { isCustom: true })}
    >
      <Text style={styles.customHabitText}>Custom Habit</Text>
    </TouchableOpacity>
  );

  const renderHabitLimitIndicator = () => {
    if (!currentUser || isEditing) return null;

    const isPremium = premiumService.isPremiumUser(currentUser);
    const maxHabits = authService.getMaxHabitsForUser(currentUser);
    const shouldShowUpgrade = premiumService.shouldShowUpgradePrompt(currentUser, currentHabitCount);

    return (
      <View style={[styles.limitIndicator, shouldShowUpgrade && styles.limitIndicatorWarning]}>
        <View style={styles.limitInfo}>
          <Text style={styles.limitText}>
            {isPremium ? 'Unlimited habits' : `${currentHabitCount}/${maxHabits} habits used`}
          </Text>
          {!isPremium && (
            <Text style={styles.limitSubtext}>
              {premiumService.getHabitLimitMessage(currentUser)}
            </Text>
          )}
        </View>
        {shouldShowUpgrade && (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Premium' as any)}
          >
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderHabitLimitIndicator()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderIdentitySelector()}
        {renderCategories()}
        {renderPopularSection()}
        {renderCustomHabitButton()}
      </ScrollView>
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
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  saveButton: {
    backgroundColor: '#FF6B7A',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  categoriesSection: {
    paddingVertical: theme.spacing.lg,
  },
  categoriesScrollContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  categoryButton: {
    alignItems: 'center',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 24,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  templateIcon: {
    fontSize: 20,
    marginRight: theme.spacing.lg,
    width: 24,
  },
  templateTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  templateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  favoriteButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.xs,
  },
  addButton: {
    padding: theme.spacing.sm,
  },
  customHabitButton: {
    backgroundColor: '#FF6B7A',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  customHabitText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  limitIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  limitIndicatorWarning: {
    backgroundColor: theme.colors.lightOrange,
    borderLeftColor: theme.colors.lightRed,
  },
  limitInfo: {
    flex: 1,
  },
  limitText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  limitSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  upgradeButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  upgradeButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  headerButton: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  frequencyOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  frequencyOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  frequencyOptionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  frequencyOptionTextSelected: {
    color: theme.colors.white,
  },
  sectionHeader: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  microStepsContainer: {
    marginTop: theme.spacing.lg,
  },
  microStepsDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  microStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  microStepInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  removeMicroStepButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  addMicroStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  addMicroStepText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  identityList: {
    marginBottom: theme.spacing.md,
  },
  identityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  identityOptionSelected: {
    borderColor: '#FF6B7A',
    backgroundColor: '#FF6B7A10',
  },
  identityContent: {
    flex: 1,
  },
  identityText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  identityTextSelected: {
    color: '#FF6B7A',
  },
  identityCategory: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  createIdentityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#FF6B7A',
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#FF6B7A05',
  },
  createIdentityText: {
    fontSize: theme.fontSize.sm,
    color: '#FF6B7A',
    marginLeft: theme.spacing.xs,
    fontWeight: theme.fontWeight.medium,
  },
  identityCreationModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  identityCategories: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  identityCategoryButton: {
    backgroundColor: '#FF6B7A',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  identityCategoryText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  cancelButton: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
});