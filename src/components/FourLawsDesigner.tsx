import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { NeumorphCard } from './neumorphism/NeumorphCard';
import { NeumorphButton } from './neumorphism/NeumorphButton';
import { NeumorphInput } from './neumorphism/NeumorphInput';
import { Habit } from '../types';

interface FourLawsDesign {
  law1_obvious: {
    cues: string[];
    environment: string;
    implementation: string;
    [key: string]: string[] | string;
  };
  law2_attractive: {
    motivation: string;
    rewards: string[];
    temptationBundling: string;
    [key: string]: string[] | string;
  };
  law3_easy: {
    barriers: string[];
    simplification: string;
    twoMinuteRule: string;
    [key: string]: string[] | string;
  };
  law4_satisfying: {
    tracking: string;
    celebration: string;
    accountability: string;
    [key: string]: string[] | string;
  };
}

interface FourLawsDesignerProps {
  habit: Habit;
  onSave: (designData: FourLawsDesign) => void;
}

export const FourLawsDesigner: React.FC<FourLawsDesignerProps> = ({
  habit,
  onSave,
}) => {
  const [currentLaw, setCurrentLaw] = useState(1);
  const [designData, setDesignData] = useState<FourLawsDesign>({
    law1_obvious: {
      cues: [''],
      environment: '',
      implementation: '',
    },
    law2_attractive: {
      motivation: '',
      rewards: [''],
      temptationBundling: '',
    },
    law3_easy: {
      barriers: [''],
      simplification: '',
      twoMinuteRule: '',
    },
    law4_satisfying: {
      tracking: '',
      celebration: '',
      accountability: '',
    },
  });

  const laws = [
    {
      number: 1,
      title: 'Make it Obvious',
      subtitle: 'Design your environment for success',
      icon: 'eye-outline',
      color: '#3B82F6',
      description: 'Create clear cues and triggers that prompt your habit',
    },
    {
      number: 2,
      title: 'Make it Attractive',
      subtitle: 'Increase your motivation and desire',
      icon: 'heart-outline',
      color: '#EF4444',
      description: 'Bundle your habit with something you enjoy',
    },
    {
      number: 3,
      title: 'Make it Easy',
      subtitle: 'Reduce friction and barriers',
      icon: 'flash-outline',
      color: '#10B981',
      description: 'Simplify your habit to make it as easy as possible',
    },
    {
      number: 4,
      title: 'Make it Satisfying',
      subtitle: 'Create immediate rewards',
      icon: 'star-outline',
      color: '#F59E0B',
      description: 'Celebrate wins and track your progress',
    },
  ];

  const updateDesignData = (law: keyof FourLawsDesign, field: string, value: any) => {
    setDesignData(prev => ({
      ...prev,
      [law]: {
        ...prev[law],
        [field]: value,
      },
    }));
  };

  const addArrayItem = (law: keyof FourLawsDesign, field: string) => {
    setDesignData(prev => ({
      ...prev,
      [law]: {
        ...prev[law],
        [field]: [...(prev[law][field] as string[]), ''],
      },
    }));
  };

  const updateArrayItem = (law: keyof FourLawsDesign, field: string, index: number, value: string) => {
    setDesignData(prev => {
      const array = [...(prev[law][field] as string[])];
      array[index] = value;
      return {
        ...prev,
        [law]: {
          ...prev[law],
          [field]: array,
        },
      };
    });
  };

  const removeArrayItem = (law: keyof FourLawsDesign, field: string, index: number) => {
    setDesignData(prev => {
      const array = (prev[law][field] as string[]).filter((_, i) => i !== index);
      return {
        ...prev,
        [law]: {
          ...prev[law],
          [field]: array.length === 0 ? [''] : array,
        },
      };
    });
  };

  const renderArrayInput = (
    law: keyof FourLawsDesign,
    field: string,
    placeholder: string,
    items: string[]
  ) => (
    <View style={styles.arrayInputContainer}>
      {items.map((item, index) => (
        <View key={index} style={styles.arrayInputRow}>
          <View style={styles.arrayInputField}>
            <NeumorphInput
              value={item}
              onChangeText={(value) => updateArrayItem(law, field, index, value)}
              placeholder={placeholder}
              multiline
              style={styles.arrayInput}
            />
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeArrayItem(law, field, index)}
          >
            <Ionicons name="close-circle" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addArrayItem(law, field)}
      >
        <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.addButtonText}>Add another</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLaw1 = () => (
    <ScrollView style={styles.lawContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.lawDescription}>
        Create clear cues and triggers that will remind you to perform your habit.
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Visual Cues</Text>
        <Text style={styles.fieldHint}>What will remind you to do this habit?</Text>
        {renderArrayInput('law1_obvious', 'cues', 'e.g., Put workout clothes next to bed', designData.law1_obvious.cues)}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Environment Design</Text>
        <Text style={styles.fieldHint}>How will you arrange your environment?</Text>
        <NeumorphInput
          value={designData.law1_obvious.environment}
          onChangeText={(value) => updateDesignData('law1_obvious', 'environment', value)}
          placeholder="Describe how you'll set up your space for success"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Implementation Intention</Text>
        <Text style={styles.fieldHint}>"I will [BEHAVIOR] at [TIME] in [LOCATION]"</Text>
        <NeumorphInput
          value={designData.law1_obvious.implementation}
          onChangeText={(value) => updateDesignData('law1_obvious', 'implementation', value)}
          placeholder="I will exercise at 7am in my living room"
          multiline
          numberOfLines={2}
        />
      </View>
    </ScrollView>
  );

  const renderLaw2 = () => (
    <ScrollView style={styles.lawContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.lawDescription}>
        Make your habit appealing by connecting it to something you enjoy.
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Why This Matters</Text>
        <Text style={styles.fieldHint}>Connect to your deeper motivation</Text>
        <NeumorphInput
          value={designData.law2_attractive.motivation}
          onChangeText={(value) => updateDesignData('law2_attractive', 'motivation', value)}
          placeholder="This habit will help me become the type of person who..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Immediate Rewards</Text>
        <Text style={styles.fieldHint}>How will you celebrate small wins?</Text>
        {renderArrayInput('law2_attractive', 'rewards', 'e.g., Listen to favorite podcast during workout', designData.law2_attractive.rewards)}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Temptation Bundling</Text>
        <Text style={styles.fieldHint}>Pair with something you want to do</Text>
        <NeumorphInput
          value={designData.law2_attractive.temptationBundling}
          onChangeText={(value) => updateDesignData('law2_attractive', 'temptationBundling', value)}
          placeholder="After I [HABIT], I will [TREAT]"
          multiline
          numberOfLines={2}
        />
      </View>
    </ScrollView>
  );

  const renderLaw3 = () => (
    <ScrollView style={styles.lawContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.lawDescription}>
        Reduce friction and make your habit as easy as possible to start.
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Current Barriers</Text>
        <Text style={styles.fieldHint}>What makes this habit difficult?</Text>
        {renderArrayInput('law3_easy', 'barriers', 'e.g., Gym is far away', designData.law3_easy.barriers)}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Simplification Strategy</Text>
        <Text style={styles.fieldHint}>How can you make this easier?</Text>
        <NeumorphInput
          value={designData.law3_easy.simplification}
          onChangeText={(value) => updateDesignData('law3_easy', 'simplification', value)}
          placeholder="Prepare everything the night before"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Two-Minute Rule</Text>
        <Text style={styles.fieldHint}>What's the smallest version of this habit?</Text>
        <NeumorphInput
          value={designData.law3_easy.twoMinuteRule}
          onChangeText={(value) => updateDesignData('law3_easy', 'twoMinuteRule', value)}
          placeholder="Put on workout clothes"
          multiline
          numberOfLines={2}
        />
      </View>
    </ScrollView>
  );

  const renderLaw4 = () => (
    <ScrollView style={styles.lawContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.lawDescription}>
        Create immediate satisfaction and track your progress.
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Progress Tracking</Text>
        <Text style={styles.fieldHint}>How will you measure success?</Text>
        <NeumorphInput
          value={designData.law4_satisfying.tracking}
          onChangeText={(value) => updateDesignData('law4_satisfying', 'tracking', value)}
          placeholder="Mark calendar, use app, count repetitions"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Immediate Celebration</Text>
        <Text style={styles.fieldHint}>How will you celebrate right after?</Text>
        <NeumorphInput
          value={designData.law4_satisfying.celebration}
          onChangeText={(value) => updateDesignData('law4_satisfying', 'celebration', value)}
          placeholder="Fist pump, say 'Yes!', text a friend"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Accountability</Text>
        <Text style={styles.fieldHint}>Who will help you stay consistent?</Text>
        <NeumorphInput
          value={designData.law4_satisfying.accountability}
          onChangeText={(value) => updateDesignData('law4_satisfying', 'accountability', value)}
          placeholder="Workout partner, family member, online community"
          multiline
          numberOfLines={2}
        />
      </View>
    </ScrollView>
  );

  const renderLawContent = () => {
    switch (currentLaw) {
      case 1: return renderLaw1();
      case 2: return renderLaw2();
      case 3: return renderLaw3();
      case 4: return renderLaw4();
      default: return null;
    }
  };

  const handleSave = () => {
    // Validate that at least some fields are filled
    const hasContent = Object.values(designData).some(law => {
      return Object.values(law as Record<string, string | string[]>).some((field: string | string[]) =>
        Array.isArray(field) ? field.some(item => item.trim()) : (field as string).trim()
      );
    });

    if (!hasContent) {
      Alert.alert('No Content', 'Please fill out at least some fields before saving.');
      return;
    }

    onSave(designData);
  };

  const currentLawData = laws[currentLaw - 1];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.habitInfo}>
          <Text style={styles.habitTitle}>{habit.title}</Text>
          <Text style={styles.headerSubtitle}>Design your habit for success</Text>
        </View>
      </View>

      {/* Law Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lawNavigation}>
        {laws.map((law) => (
          <TouchableOpacity
            key={law.number}
            style={[
              styles.lawTab,
              currentLaw === law.number && styles.lawTabActive,
              { borderBottomColor: law.color }
            ]}
            onPress={() => setCurrentLaw(law.number)}
          >
            <Ionicons
              name={law.icon as any}
              size={20}
              color={currentLaw === law.number ? law.color : theme.colors.textSecondary}
            />
            <Text style={[
              styles.lawTabText,
              currentLaw === law.number && { color: law.color }
            ]}>
              {law.number}. {law.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Current Law Header */}
      <NeumorphCard style={styles.currentLawHeader}>
        <View style={styles.currentLawInfo}>
          <View style={[styles.lawIcon, { backgroundColor: `${currentLawData.color}15` }]}>
            <Ionicons name={currentLawData.icon as any} size={24} color={currentLawData.color} />
          </View>
          <View style={styles.lawTitleContainer}>
            <Text style={styles.currentLawTitle}>{currentLawData.title}</Text>
            <Text style={styles.currentLawSubtitle}>{currentLawData.subtitle}</Text>
          </View>
        </View>
      </NeumorphCard>

      {/* Law Content */}
      <View style={styles.contentContainer}>
        {renderLawContent()}
      </View>

      {/* Navigation and Save */}
      <View style={styles.footer}>
        <View style={styles.navigationButtons}>
          {currentLaw > 1 && (
            <NeumorphButton
              title="Previous"
              variant="secondary"
              onPress={() => setCurrentLaw(currentLaw - 1)}
              style={styles.navButton}
            />
          )}
          {currentLaw < 4 && (
            <NeumorphButton
              title="Next"
              variant="primary"
              onPress={() => setCurrentLaw(currentLaw + 1)}
              style={styles.navButton}
            />
          )}
        </View>
        <NeumorphButton
          title="Save Habit Design"
          variant="primary"
          onPress={handleSave}
          style={styles.saveButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  habitInfo: {
    alignItems: 'center',
  },
  habitTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  lawNavigation: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  lawTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minWidth: 120,
  },
  lawTabActive: {
    borderBottomWidth: 2,
  },
  lawTabText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: 6,
    fontWeight: theme.fontWeight.medium,
  },
  currentLawHeader: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
  },
  currentLawInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lawIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  lawTitleContainer: {
    flex: 1,
  },
  currentLawTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  currentLawSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  contentContainer: {
    flex: 1,
  },
  lawContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  lawDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  fieldContainer: {
    marginBottom: theme.spacing.lg,
  },
  fieldLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  fieldHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    fontStyle: 'italic',
  },
  arrayInputContainer: {
    gap: theme.spacing.sm,
  },
  arrayInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  arrayInputField: {
    flex: 1,
  },
  arrayInput: {
    minHeight: 44,
  },
  removeButton: {
    marginTop: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderStyle: 'dashed',
    marginTop: theme.spacing.xs,
  },
  addButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginLeft: 6,
    fontWeight: theme.fontWeight.medium,
  },
  footer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSoft,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  navButton: {
    flex: 0.48,
  },
  saveButton: {
    width: '100%',
  },
});