import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FrequencyType, Habit, HabitType, HealthMetricType, HealthHabitConfig, User } from '../../types';
import { RootStackScreenProps } from '../../types/navigation';
import { healthService } from '../../services/health';
import { dataService } from '../../services/core';
import { habitTemplatesService } from '../../services/habits';
import { authService } from '../../services/auth';
import { premiumService } from '../../services/premium';
import { featureGatingService } from '../../services/premium';
import { atomicHabitsService, IdentityStatement } from '../../services/habits';
import { UpgradePromptModal } from '../../components/UpgradePrompt';
import { theme } from '../../theme';
import {
  NeumorphCard,
  NeumorphButton,
  NeumorphismColors,
  getRandomHabitColor,
  ColorPicker,
} from '../../components/neumorphism';

type CreateEditHabitScreenProps = 
  | RootStackScreenProps<'CreateHabit'> 
  | RootStackScreenProps<'CreateEditHabit'>
  | RootStackScreenProps<'EditHabit'>
  | RootStackScreenProps<'HabitEdit'>;

const frequencyOptions: { label: string; value: FrequencyType }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Custom', value: 'custom' },
];

export const CreateEditHabitScreen: React.FC<CreateEditHabitScreenProps> = ({
  navigation,
  route,
}) => {
  const isEditing = ('habitId' in route.params && route.params.habitId) || ('habit' in route.params && route.params.habit);
  const habitId = 'habitId' in route.params ? route.params.habitId : ('habit' in route.params ? route.params.habit?.id : null);
  const existingHabit = 'habit' in route.params ? route.params.habit : null;
  const template = 'template' in route.params ? route.params.template : null;
  const isCustom = route.params && 'isCustom' in route.params && route.params.isCustom;

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [isShared, setIsShared] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [habitColor, setHabitColor] = useState(NeumorphismColors.habitColors.sage);
  const [habitEmoji, setHabitEmoji] = useState('');
  const [microSteps, setMicroSteps] = useState<string[]>(['']);
  const [enableMicroSteps, setEnableMicroSteps] = useState(false);
  const [loading, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentHabitCount, setCurrentHabitCount] = useState(0);
  
  // States for form visibility control
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  // Atomic Habits states
  const [identityStatements, setIdentityStatements] = useState<IdentityStatement[]>([]);
  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null);
  const [showIdentityCreation, setShowIdentityCreation] = useState(false);
  const [newIdentityCategory, setNewIdentityCategory] = useState<string>('');
  
  // Premium/Feature gating states
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePrompt, setUpgradePrompt] = useState<any>(null);
  const [showTrial, setShowTrial] = useState(false);
  
  // Health-specific states
  const [habitType, setHabitType] = useState<HabitType>('manual');
  const [healthConfig, setHealthConfig] = useState<HealthHabitConfig>({
    metricType: 'steps',
    targetValue: 10000,
    unit: 'steps',
    autoTrack: true,
  });
  const [healthIntegrationAvailable, setHealthIntegrationAvailable] = useState(false);

  // Tracking type states
  const [trackingType, setTrackingType] = useState<'counter' | 'timer'>('counter');
  const [targetValue, setTargetValue] = useState(1);
  const [targetUnit, setTargetUnit] = useState('times');

  useEffect(() => {
    loadTemplateData();
    loadUserData();
    loadIdentityData();
    
    if (template) {
      // Initialize with template data
      setTitle(template.title || '');
      setNotes(template.notes || '');
      setFrequency(template.frequency || 'daily');
      setHabitColor(template.color || NeumorphismColors.habitColors.sage);
      setHabitEmoji(template.emoji || '');
      setHabitType(template.type || 'manual');
      
      // Load target config if available
      if (template.targetConfig) {
        setTargetValue(template.targetConfig.targetValue || 1);
        setTargetUnit(template.targetConfig.unit || 'times');
        setTrackingType(template.targetConfig.isTimeBased ? 'timer' : 'counter');
      }
      
      // Load health config if available
      if (template.healthConfig) {
        setHealthConfig(template.healthConfig);
      }
      
      setShowCustomForm(true);
    } else if (isEditing && existingHabit) {
      // Load habit data from existing habit object
      setTitle(existingHabit.title || '');
      setNotes(existingHabit.notes || '');
      setFrequency(existingHabit.frequency || 'daily');
      setIsShared(existingHabit.isShared || false);
      setHabitColor(existingHabit.color || NeumorphismColors.habitColors.sage);
      setHabitEmoji(existingHabit.emoji || '');
      setHabitType(existingHabit.type || 'manual');
      
      // Load target config if available
      if (existingHabit.targetConfig) {
        setTargetValue(existingHabit.targetConfig.targetValue || 1);
        setTargetUnit(existingHabit.targetConfig.unit || 'times');
        setTrackingType(existingHabit.targetConfig.isTimeBased ? 'timer' : 'counter');
      }
      
      // Load health config if available
      if (existingHabit.healthConfig) {
        setHealthConfig(existingHabit.healthConfig);
      }
      
      setShowCustomForm(true);
    } else if (isEditing) {
      // TODO: Load habit data from API using habitId
      setTitle('Example Habit');
      setNotes('Example notes');
      setFrequency('daily');
      setIsShared(false);
      setShowCustomForm(true);
    } else {
      // Check if we should show custom form directly (from route params)
      if (isCustom) {
        setShowCustomForm(true);
        
        // Check if template data was provided
        if (route.params && 'templateData' in route.params && route.params.templateData) {
          const template = route.params.templateData as any;
          setTitle(template.title || '');
          setHabitColor(template.color || (typeof getRandomHabitColor === 'function' ? getRandomHabitColor() : NeumorphismColors.habitColors.sage));
          setSelectedTemplate(template);
        } else {
          // Assign random color for new custom habits
          setHabitColor(typeof getRandomHabitColor === 'function' ? getRandomHabitColor() : NeumorphismColors.habitColors.sage);
        }
      }
    }
    
    // Check if creating health habit from route params
    if (route.params && 'type' in route.params && route.params.type === 'health') {
      setHabitType('health');
    }
  }, [isEditing, habitId, route.params, isCustom, template]);

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
    
    // Define popular habits with unique random colors
    const popularHabits = [
      { id: 1, icon: '🚶', title: 'Walk', isFavorite: true, color: typeof getRandomHabitColor === 'function' ? getRandomHabitColor() : NeumorphismColors.habitColors.sage },
      { id: 2, icon: '🛏️', title: 'Sleep', isFavorite: true, color: typeof getRandomHabitColor === 'function' ? getRandomHabitColor() : NeumorphismColors.habitColors.lavender },
      { id: 3, icon: '🏃', title: 'Run', isFavorite: false, color: typeof getRandomHabitColor === 'function' ? getRandomHabitColor() : NeumorphismColors.habitColors.coral },
      { id: 4, icon: '🧍', title: 'Stand', isFavorite: true, color: typeof getRandomHabitColor === 'function' ? getRandomHabitColor() : NeumorphismColors.habitColors.sky },
      { id: 5, icon: '🚴', title: 'Cycling', isFavorite: true, color: typeof getRandomHabitColor === 'function' ? getRandomHabitColor() : NeumorphismColors.habitColors.peach },
      { id: 6, icon: '💪', title: 'Workout', isFavorite: true, color: typeof getRandomHabitColor === 'function' ? getRandomHabitColor() : NeumorphismColors.habitColors.mint },
      { id: 7, icon: '🔥', title: 'Active Calorie', isFavorite: true, color: typeof getRandomHabitColor === 'function' ? getRandomHabitColor() : NeumorphismColors.habitColors.rose },
      { id: 8, icon: '🔥', title: 'Burn Calorie', isFavorite: true, color: typeof getRandomHabitColor === 'function' ? getRandomHabitColor() : NeumorphismColors.habitColors.slate },
      { id: 9, icon: '🏃', title: 'Exercise', isFavorite: true, color: typeof getRandomHabitColor === 'function' ? getRandomHabitColor() : NeumorphismColors.habitColors.cream },
      { id: 10, icon: '🧘', title: 'Meditation', isFavorite: true, color: typeof getRandomHabitColor === 'function' ? getRandomHabitColor() : NeumorphismColors.habitColors.dusty },
      { id: 11, icon: '📚', title: 'Read a book', isFavorite: false, color: typeof getRandomHabitColor === 'function' ? getRandomHabitColor() : NeumorphismColors.habitColors.ocean },
    ];
    setTemplates(popularHabits);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const categoryTemplates = habitTemplatesService.getTemplatesByCategory(categoryId);
    setTemplates(categoryTemplates);
  };

  const handleTemplateSelect = (template: any) => {
    // Populate form with template data and switch to custom form
    setTitle(template.title);
    setHabitColor(template.color || (typeof getRandomHabitColor === 'function' ? getRandomHabitColor() : NeumorphismColors.habitColors.sage));
    setHabitEmoji(template.icon || '');
    
    // Instead of navigating, we'll just set a state to show the custom form
    // This will be handled by adding a local state to control form visibility
    setShowCustomForm(true);
    setSelectedTemplate(template);
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

    setSaving(true);

    try {
      const habitData = {
        title: title.trim(),
        notes: notes.trim(),
        frequency,
        type: habitType,
        color: habitColor,
        emoji: habitEmoji,
        isShared,
        targetConfig: {
          hasTarget: true,
          targetValue: 1,
          unit: 'times',
          isTimeBased: false,
        },
        healthConfig: habitType === 'health' ? healthConfig : undefined,
      };

      if (isEditing) {
        // Update existing habit - no feature gating needed
        const existingHabit = await dataService.getHabitById(habitId!);
        if (existingHabit) {
          const updatedHabit = { ...existingHabit, ...habitData };
          await dataService.updateHabit(habitId!, habitData);
          Alert.alert('Success', 'Habit updated successfully!');
          navigation.goBack();
        }
      } else {
        // Create new habit - check feature gating
        const result = await dataService.createHabit(habitData);
        
        if (result.blocked) {
          // User hit the limit, show upgrade prompt
          if (result.upgradePrompt) {
            setUpgradePrompt(result.upgradePrompt);
            setShowUpgradePrompt(true);
          } else {
            Alert.alert('Limit Reached', result.reason || 'Unable to create habit');
          }
          return;
        }

        // Success - habit created
        if (result.habit) {
          Alert.alert('Success', 'Habit created successfully!');
          navigation.goBack();
          
          // Show upgrade prompt if user is approaching limit
          if (result.upgradePrompt) {
            setTimeout(() => {
              setUpgradePrompt(result.upgradePrompt);
              setShowUpgradePrompt(true);
            }, 1000); // Delay to let success message show
          }
        }
      }
    } catch (error) {
      console.error('Error saving habit:', error);
      Alert.alert('Error', 'Failed to save habit. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [isEditing, habitId, title, notes, frequency, isShared, habitType, healthConfig, targetValue, targetUnit, trackingType, habitColor, habitEmoji, selectedIdentity, navigation]);

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

  const renderTrackingTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tracking Type</Text>
      <Text style={styles.sectionDescription}>
        How would you like to track this habit?
      </Text>
      
      <View style={styles.trackingTypeContainer}>
        <TouchableOpacity
          style={[
            styles.trackingTypeOption,
            trackingType === 'counter' && styles.trackingTypeOptionSelected,
          ]}
          onPress={() => {
            setTrackingType('counter');
            setTargetUnit('times');
            setTargetValue(1);
          }}
        >
          <View style={styles.trackingTypeIcon}>
            <Ionicons 
              name="add-circle" 
              size={24} 
              color={trackingType === 'counter' ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </View>
          <View style={styles.trackingTypeContent}>
            <Text style={[
              styles.trackingTypeTitle,
              trackingType === 'counter' && styles.trackingTypeTextSelected,
            ]}>
              Counter
            </Text>
            <Text style={styles.trackingTypeDescription}>
              Count repetitions, sets, or occurrences
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.trackingTypeOption,
            trackingType === 'timer' && styles.trackingTypeOptionSelected,
          ]}
          onPress={() => {
            setTrackingType('timer');
            setTargetUnit('minutes');
            setTargetValue(30);
          }}
        >
          <View style={styles.trackingTypeIcon}>
            <Ionicons 
              name="time" 
              size={24} 
              color={trackingType === 'timer' ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </View>
          <View style={styles.trackingTypeContent}>
            <Text style={[
              styles.trackingTypeTitle,
              trackingType === 'timer' && styles.trackingTypeTextSelected,
            ]}>
              Timer
            </Text>
            <Text style={styles.trackingTypeDescription}>
              Track duration with start/stop timer
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Target Configuration */}
      <View style={styles.targetConfigSection}>
        <Text style={styles.targetConfigTitle}>Target</Text>
        <View style={styles.targetConfigContainer}>
          <TextInput
            style={styles.targetValueInput}
            value={targetValue.toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || 1;
              setTargetValue(value);
            }}
            keyboardType="numeric"
            placeholder="1"
          />
          <Text style={styles.targetUnitText}>
            {trackingType === 'timer' ? 'minutes' : targetUnit}
          </Text>
        </View>
        
        {trackingType === 'counter' && (
          <View style={styles.unitSelector}>
            {['times', 'reps', 'sets', 'pages', 'glasses'].map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.unitOption,
                  targetUnit === unit && styles.unitOptionSelected,
                ]}
                onPress={() => setTargetUnit(unit)}
              >
                <Text style={[
                  styles.unitOptionText,
                  targetUnit === unit && styles.unitOptionTextSelected,
                ]}>
                  {unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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

  const handleBackPress = () => {
    if (showCustomForm && !isEditing) {
      // If we're in custom form, go back to template selection
      setShowCustomForm(false);
      setSelectedTemplate(null);
      setTitle('');
      setNotes('');
      setHabitColor(NeumorphismColors.habitColors.sage);
    } else {
      // Otherwise, go back normally
      navigation.goBack();
    }
  };

  const renderHeader = () => (
    <NeumorphCard
      variant="convex"
      size="medium"
      style={styles.header}
    >
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleBackPress}
      >
        <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {isEditing ? 'Edit Habit' : (showCustomForm ? 'New Habit' : 'Create Habit')}
      </Text>
      <NeumorphButton
        title="Save"
        variant="primary"
        size="small"
        onPress={handleSave}
        disabled={!title.trim()}
        glassIntensity="strong"
        style={[styles.saveButton, { opacity: showCustomForm || isEditing ? 1 : 0 }]}
      />
    </NeumorphCard>
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
        <NeumorphCard
          key={template.id}
          variant="convex"
          size="medium"
          style={styles.templateCard}
        >
          <TouchableOpacity 
            style={styles.templateItem}
            onPress={() => handleTemplateSelect(template)}
          >
            <View style={[styles.templateIconContainer, { backgroundColor: template.color }]}>
              <Text style={styles.templateIcon}>{template.icon}</Text>
            </View>
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
        </NeumorphCard>
      ))}
    </View>
  );

  const handleCreateIdentity = async (category: string) => {
    try {
      const goals: string[] = []; // Could be expanded to capture user goals
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

  const renderEmojiPicker = () => {
    const commonEmojis = [
      '🏃', '💪', '📚', '🧘', '💧', '🚶', '🛏️', '🧍', '🚴', '🔥',
      '🎯', '⏰', '📝', '🎨', '🎵', '🌱', '☕', '🧠', '❤️', '✨',
      '🌟', '🎉', '🏆', '🌞', '🌙', '💡', '🔔', '📱', '💻', '🎮'
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emoji</Text>
        <Text style={styles.sectionDescription}>
          Choose an emoji to represent your habit
        </Text>
        <View style={styles.emojiGrid}>
          {commonEmojis.map((emoji, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.emojiOption,
                habitEmoji === emoji && styles.selectedEmoji
              ]}
              onPress={() => setHabitEmoji(emoji)}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              styles.emojiOption,
              habitEmoji === '' && styles.selectedEmoji
            ]}
            onPress={() => setHabitEmoji('')}
          >
            <Text style={styles.noEmojiText}>None</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderColorPicker = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Color</Text>
      <Text style={styles.sectionDescription}>
        Choose a color that represents your habit
      </Text>
      <ColorPicker
        selectedColor={habitColor}
        onColorSelect={setHabitColor}
      />
    </View>
  );

  const renderHabitForm = () => (
    <NeumorphCard
      variant="convex"
      size="large"
      style={styles.formCard}
    >
      {/* Habit Preview */}
      <View style={styles.habitPreview}>
        <View style={[styles.habitPreviewCircle, { backgroundColor: habitColor }]}>
          <Text style={styles.habitPreviewIcon}>
            {habitEmoji || selectedTemplate?.icon || '📋'}
          </Text>
        </View>
        <View style={styles.habitPreviewInfo}>
          <Text style={styles.habitPreviewTitle}>{title || 'New Habit'}</Text>
          <Text style={styles.habitPreviewDescription}>Description (Optional)</Text>
        </View>
      </View>

      {/* Title Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Habit Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter habit name"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      {/* Notes Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Add description..."
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      {/* Emoji Picker */}
      {renderEmojiPicker()}

      {/* Color Picker */}
      {renderColorPicker()}

      {/* Frequency Selector */}
      {renderFrequencySelector()}

      {/* Tracking Type Selector */}
      {renderTrackingTypeSelector()}

      {/* Micro Steps */}
      {renderMicroSteps()}

      {/* Health Configuration */}
      {habitType === 'health' && renderHealthConfig()}

      {/* Save Button */}
      <NeumorphButton
        title={isEditing ? "Update Habit" : "Create Habit"}
        variant="primary"
        size="large"
        onPress={handleSave}
        disabled={!title.trim() || loading}
        style={styles.saveButton}
      />
    </NeumorphCard>
  );

  const renderCustomHabitButton = () => (
    <NeumorphButton
      title="Create Custom Habit"
      variant="primary"
      size="large"
      onPress={() => {
        setShowCustomForm(true);
        setHabitColor(typeof getRandomHabitColor === 'function' ? getRandomHabitColor() : NeumorphismColors.habitColors.sage);
        setSelectedTemplate(null);
      }}
      glassIntensity="strong"
      style={styles.customHabitButton}
    />
  );

  const renderHealthConfig = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Health Configuration</Text>
      <Text style={styles.sectionSubtitle}>
        Health-based habit configurations will be added here
      </Text>
    </View>
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
    <View style={[styles.container, { backgroundColor: NeumorphismColors.background }]}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <View>
          {renderHeader()}
        </View>
        
        <View>
          {renderHabitLimitIndicator()}
        </View>
        
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {(showCustomForm || isEditing) ? (
            // Show custom habit creation form
            <View>
              {renderHabitForm()}
            </View>
          ) : (
            // Show template selection interface
            <>
              <View>
                <NeumorphCard
                  variant="convex"
                  size="large"
                  style={styles.mainCard}
                >
                  {renderIdentitySelector()}
                </NeumorphCard>
              </View>
              
              <View>
                <NeumorphCard
                  variant="convex"
                  size="large"
                  style={styles.categoriesCard}
                >
                  {renderCategories()}
                </NeumorphCard>
              </View>
              
              <View>
                <NeumorphCard
                  variant="convex"
                  size="large"
                  style={styles.templatesCard}
                >
                  {renderPopularSection()}
                </NeumorphCard>
              </View>
              
              <View>
                {renderCustomHabitButton()}
              </View>
            </>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && upgradePrompt && (
        <UpgradePromptModal
          visible={showUpgradePrompt}
          prompt={upgradePrompt}
          onUpgrade={() => {
            setShowUpgradePrompt(false);
            navigation.navigate('Premium' as any);
          }}
          onClose={() => setShowUpgradePrompt(false)}
          onStartTrial={async () => {
            try {
              await premiumService.startFreeTrial();
              setShowUpgradePrompt(false);
              Alert.alert('Trial Started!', '7-day free trial activated. Enjoy unlimited habits!');
            } catch (error) {
              Alert.alert('Error', 'Failed to start trial');
            }
          }}
          showTrial={showTrial}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  mainCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: 0,
  },
  categoriesCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: 0,
  },
  templatesCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NeumorphismColors.surface,
    // Neumorphism button effect
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  categoriesSection: {
    padding: theme.spacing.lg,
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
    backgroundColor: NeumorphismColors.surface,
    // Neumorphism effect for category icons
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryEmoji: {
    fontSize: 24,
  },
  section: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
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
  templateCard: {
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: theme.spacing.lg,
  },
  templateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    // Neumorphic effect for icon container
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  templateIcon: {
    fontSize: 20,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.xs,
    backgroundColor: NeumorphismColors.surface,
    // Neumorphic button effect
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: NeumorphismColors.surface,
    // Neumorphic button effect
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  customHabitButton: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra space to prevent content being cut off
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
  sectionDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  trackingTypeContainer: {
    marginBottom: theme.spacing.md,
  },
  trackingTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  trackingTypeOptionSelected: {
    backgroundColor: `${theme.colors.primary}10`,
    borderColor: theme.colors.primary,
  },
  trackingTypeIcon: {
    marginRight: theme.spacing.md,
  },
  trackingTypeContent: {
    flex: 1,
  },
  trackingTypeTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  trackingTypeTextSelected: {
    color: theme.colors.primary,
  },
  trackingTypeDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  targetConfigSection: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  targetConfigTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  targetConfigContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  targetValueInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    textAlign: 'center',
    marginRight: theme.spacing.sm,
  },
  targetUnitText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  unitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  unitOption: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  unitOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  unitOptionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  unitOptionTextSelected: {
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
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: NeumorphismColors.text,
    backgroundColor: NeumorphismColors.surface,
    // Neumorphism inset effect for input
    borderWidth: 1,
    borderColor: NeumorphismColors.darkShadow,
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: -2, // Inset effect
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
    backgroundColor: NeumorphismColors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    // Neumorphism button effect
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
  // New styles for habit form
  formCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  input: {
    backgroundColor: NeumorphismColors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    // Inset neumorphic effect
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: -2,
    borderWidth: 1,
    borderColor: NeumorphismColors.darkShadow,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: theme.spacing.lg,
  },
  // Habit Preview Styles
  habitPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: NeumorphismColors.lightShadow,
    marginBottom: theme.spacing.lg,
  },
  habitPreviewCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    // Neumorphic effect for preview circle
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  habitPreviewIcon: {
    fontSize: 32,
  },
  habitPreviewInfo: {
    flex: 1,
  },
  habitPreviewTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  habitPreviewDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NeumorphismColors.surface,
    // Neumorphic button effect
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedEmoji: {
    backgroundColor: NeumorphismColors.primary,
    // Pressed/selected state
    shadowColor: NeumorphismColors.lightShadow,
    shadowOffset: { width: -1, height: -1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: -1,
    borderColor: theme.colors.primary,
  },
  emojiText: {
    fontSize: 20,
  },
  noEmojiText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
});