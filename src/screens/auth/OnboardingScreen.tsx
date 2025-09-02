import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme/index';
import { NeumorphCard, NeumorphButton } from '../../components/neumorphism';
import { dataService } from '../../services/core';
import { HABIT_TEMPLATES, HabitTemplate } from '../../data/habitTemplates';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  component: React.ReactNode;
}

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<HabitTemplate[]>([]);
  const [userName, setUserName] = useState('');

  const goals = [
    { id: 'health', title: 'Health & Fitness', icon: '💪', description: 'Build physical wellness habits' },
    { id: 'productivity', title: 'Productivity', icon: '🎯', description: 'Improve focus and efficiency' },
    { id: 'mindfulness', title: 'Mindfulness', icon: '🧘', description: 'Develop inner peace and awareness' },
    { id: 'learning', title: 'Learning', icon: '📚', description: 'Expand knowledge and skills' },
    { id: 'creative', title: 'Creativity', icon: '🎨', description: 'Express yourself and create' },
    { id: 'social', title: 'Relationships', icon: '👥', description: 'Strengthen connections with others' },
  ];

  const getRecommendedTemplates = (selectedGoals: string[]): HabitTemplate[] => {
    const templates: HabitTemplate[] = [];
    selectedGoals.forEach(goal => {
      const categoryTemplates = HABIT_TEMPLATES.filter((t: HabitTemplate) => t.category === goal);
      // Add 2-3 most popular templates from each category
      templates.push(...categoryTemplates.slice(0, 3));
    });
    return templates.slice(0, 8); // Limit to 8 total recommendations
  };

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to iTrackHabit! 👋',
      subtitle: 'Let\'s build healthy habits together',
      icon: '🌟',
      color: theme.colors.primary,
      component: (
        <View style={styles.stepContent}>
          <View style={styles.welcomeIcon}>
            <Text style={styles.welcomeEmoji}>🎯</Text>
          </View>
          <Text style={styles.welcomeDescription}>
            iTrackHabit helps you build lasting habits with beautiful design, 
            intelligent tracking, and motivational achievements.
          </Text>
          <View style={styles.featuresList}>
            {[
              { icon: '📊', text: 'Beautiful analytics and progress tracking' },
              { icon: '🏆', text: 'Achievements and streak tracking' },
              { icon: '🎨', text: 'Neumorphic design that feels natural' },
              { icon: '📱', text: 'Works offline - your data stays with you' },
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>
        </View>
      )
    },
    {
      id: 'goals',
      title: 'What are your goals? 🎯',
      subtitle: 'Select areas you\'d like to improve',
      icon: '🎯',
      color: theme.colors.secondary,
      component: (
        <View style={styles.stepContent}>
          <Text style={styles.stepDescription}>
            Choose the areas that matter most to you. We'll suggest relevant habits to get you started.
          </Text>
          <View style={styles.goalsGrid}>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  selectedGoals.includes(goal.id) && styles.goalCardSelected
                ]}
                onPress={() => {
                  if (selectedGoals.includes(goal.id)) {
                    setSelectedGoals(selectedGoals.filter(g => g !== goal.id));
                  } else {
                    setSelectedGoals([...selectedGoals, goal.id]);
                  }
                }}
              >
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalDescription}>{goal.description}</Text>
                {selectedGoals.includes(goal.id) && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )
    },
    {
      id: 'habits',
      title: 'Choose your first habits ✨',
      subtitle: 'Start with habits that match your goals',
      icon: '✨',
      color: theme.colors.success,
      component: (
        <View style={styles.stepContent}>
          <Text style={styles.stepDescription}>
            Based on your goals, here are some habit suggestions. Choose 3-5 to start with - you can always add more later!
          </Text>
          <ScrollView style={styles.templatesContainer} showsVerticalScrollIndicator={false}>
            {getRecommendedTemplates(selectedGoals).map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  selectedTemplates.find(t => t.id === template.id) && styles.templateCardSelected
                ]}
                onPress={() => {
                  const exists = selectedTemplates.find(t => t.id === template.id);
                  if (exists) {
                    setSelectedTemplates(selectedTemplates.filter(t => t.id !== template.id));
                  } else {
                    setSelectedTemplates([...selectedTemplates, template]);
                  }
                }}
              >
                <View style={styles.templateHeader}>
                  <Text style={styles.templateEmoji}>{template.emoji}</Text>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateTitle}>{template.title}</Text>
                    <Text style={styles.templateDescription}>{template.description}</Text>
                    <Text style={styles.templateMeta}>
                      {template.targetConfig.targetValue} {template.targetConfig.unit} • {template.frequency}
                    </Text>
                  </View>
                  {selectedTemplates.find(t => t.id === template.id) && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )
    },
    {
      id: 'ready',
      title: 'You\'re all set! 🚀',
      subtitle: 'Time to start building great habits',
      icon: '🚀',
      color: theme.colors.primary,
      component: (
        <View style={styles.stepContent}>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Here's what we've set up for you:</Text>
            
            <NeumorphCard variant="convex" style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Ionicons name="flag" size={20} color={theme.colors.primary} />
                <Text style={styles.summaryText}>
                  {selectedGoals.length} goal area{selectedGoals.length !== 1 ? 's' : ''} selected
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                <Text style={styles.summaryText}>
                  {selectedTemplates.length} habit{selectedTemplates.length !== 1 ? 's' : ''} ready to start
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="trophy" size={20} color={theme.colors.warning} />
                <Text style={styles.summaryText}>
                  Achievement system activated
                </Text>
              </View>
            </NeumorphCard>

            <Text style={styles.tipsTitle}>💡 Pro Tips for Success:</Text>
            <View style={styles.tipsList}>
              {[
                'Start small - consistency beats intensity',
                'Track your progress daily for better results',
                'Celebrate small wins along the way',
                'Don\'t worry about perfect streaks - progress over perfection'
              ].map((tip, index) => (
                <Text key={index} style={styles.tipItem}>• {tip}</Text>
              ))}
            </View>
          </View>
        </View>
      )
    }
  ];

  const currentStepData = onboardingSteps[currentStep];

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    } else {
      finishOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  const canProceed = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return true;
      case 'goals':
        return selectedGoals.length > 0;
      case 'habits':
        return selectedTemplates.length > 0;
      case 'ready':
        return true;
      default:
        return true;
    }
  };

  const finishOnboarding = async () => {
    try {
      // Create selected habits
      await dataService.initialize();
      
      for (const template of selectedTemplates) {
        await dataService.createHabit({
          title: template.title,
          notes: template.notes,
          frequency: template.frequency as 'daily' | 'weekly',
          type: 'manual',
          targetConfig: template.targetConfig,
          emoji: template.emoji,
          color: template.color,
        });
      }

      // Mark onboarding as completed
      await AsyncStorage.setItem('onboarding_completed', 'true');
      
      // Navigate to main app
      Alert.alert(
        '🎉 Welcome aboard!',
        `You've successfully created ${selectedTemplates.length} habit${selectedTemplates.length !== 1 ? 's' : ''}. Start tracking today and build the life you want!`,
        [
          {
            text: 'Let\'s go!',
            onPress: () => navigation.navigate('Main' as any)
          }
        ]
      );
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    }
  };

  const getButtonText = () => {
    switch (currentStepData.id) {
      case 'ready':
        return 'Start My Journey';
      default:
        return 'Continue';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {onboardingSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentStep && styles.progressDotActive,
              index < currentStep && styles.progressDotCompleted
            ]}
          />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.stepTitle}>{currentStepData.title}</Text>
        <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>
      </View>

      {/* Content */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {currentStepData.component}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        {currentStep > 0 && (
          <TouchableOpacity onPress={prevStep} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.spacer} />
        
        <NeumorphButton
          title={getButtonText()}
          onPress={nextStep}
          style={[styles.continueButton, !canProceed() && styles.disabledButton]}
          disabled={!canProceed()}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textSecondary,
    opacity: 0.3,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
    opacity: 1,
    transform: [{ scale: 1.2 }],
  },
  progressDotCompleted: {
    backgroundColor: theme.colors.success,
    opacity: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  stepSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xl,
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  welcomeIcon: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  welcomeEmoji: {
    fontSize: 80,
  },
  welcomeDescription: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: theme.spacing.xl,
  },
  featuresList: {
    gap: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
    width: 32,
  },
  featureText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    flex: 1,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  goalCard: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  goalCardSelected: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successLight,
  },
  goalIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  goalTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  goalDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
  },
  templatesContainer: {
    maxHeight: 400,
  },
  templateCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardSelected: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successLight,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  templateEmoji: {
    fontSize: 24,
    marginRight: theme.spacing.md,
    width: 32,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  templateDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  templateMeta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
  },
  summaryContainer: {
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  summaryText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  tipsTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  tipsList: {
    alignSelf: 'stretch',
  },
  tipItem: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  backText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  spacer: {
    flex: 1,
  },
  continueButton: {
    paddingHorizontal: theme.spacing.xl,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default OnboardingScreen;