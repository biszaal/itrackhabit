import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { atomicHabitsService, EnvironmentDesign } from '../services/AtomicHabitsService';
import { Habit } from '../types';

interface FourLawsDesignerProps {
  habit: Habit;
  onSave?: (designData: any) => void;
}

interface LawDesign {
  law1_obvious: {
    implementationIntention: string;
    visualCues: string[];
    environmentDesign: string;
  };
  law2_attractive: {
    bundledActivity: string;
    socialElement: string;
    reframing: string;
  };
  law3_easy: {
    twoMinuteVersion: string;
    scalingPlan: string[];
    frictionReduction: string;
  };
  law4_satisfying: {
    immediateReward: string;
    habitTracker: boolean;
    celebrationRitual: string;
  };
}

export const FourLawsDesigner: React.FC<FourLawsDesignerProps> = ({
  habit,
  onSave,
}) => {
  const [selectedLaw, setSelectedLaw] = useState<1 | 2 | 3 | 4>(1);
  const [designData, setDesignData] = useState<LawDesign>({
    law1_obvious: {
      implementationIntention: '',
      visualCues: [''],
      environmentDesign: '',
    },
    law2_attractive: {
      bundledActivity: '',
      socialElement: '',
      reframing: '',
    },
    law3_easy: {
      twoMinuteVersion: '',
      scalingPlan: [''],
      frictionReduction: '',
    },
    law4_satisfying: {
      immediateReward: '',
      habitTracker: true,
      celebrationRitual: '',
    },
  });

  const [environmentDesigns, setEnvironmentDesigns] = useState<EnvironmentDesign[]>([]);

  useEffect(() => {
    loadExistingDesigns();
    generateInitialSuggestions();
  }, [habit]);

  const loadExistingDesigns = async () => {
    try {
      const designs = await atomicHabitsService.designObviousCues(habit.id, 'home');
      setEnvironmentDesigns(designs);
    } catch (error) {
      console.error('Error loading designs:', error);
    }
  };

  const generateInitialSuggestions = () => {
    // Generate 2-minute rule suggestion
    const twoMinuteRule = atomicHabitsService.implementTwoMinuteRule(habit);
    
    // Generate attractiveness strategies
    const attractivenessStrategies = atomicHabitsService.generateAttractivenessStrategies(habit);

    setDesignData(prev => ({
      ...prev,
      law3_easy: {
        ...prev.law3_easy,
        twoMinuteVersion: twoMinuteRule.miniVersion,
        scalingPlan: twoMinuteRule.scalingPlan,
      },
      law2_attractive: {
        ...prev.law2_attractive,
        bundledActivity: attractivenessStrategies[0] || '',
        socialElement: attractivenessStrategies[1] || '',
        reframing: attractivenessStrategies[2] || '',
      },
    }));
  };

  const laws = [
    {
      number: 1,
      title: 'Make It Obvious',
      subtitle: 'Cue',
      color: '#2196F3',
      icon: 'eye' as const,
      description: 'Design your environment to make good habits obvious and bad habits invisible.',
    },
    {
      number: 2,
      title: 'Make It Attractive',
      subtitle: 'Craving',
      color: '#E91E63',
      icon: 'heart' as const,
      description: 'Bundle your habits with activities you enjoy to make them more attractive.',
    },
    {
      number: 3,
      title: 'Make It Easy',
      subtitle: 'Response',
      color: '#4CAF50',
      icon: 'flash' as const,
      description: 'Reduce friction and use the 2-minute rule to make habits as easy as possible.',
    },
    {
      number: 4,
      title: 'Make It Satisfying',
      subtitle: 'Reward',
      color: '#FF9800',
      icon: 'star' as const,
      description: 'Add immediate rewards to make the experience satisfying and reinforce the behavior.',
    },
  ];

  const updateDesignData = (lawNumber: 1 | 2 | 3 | 4, field: string, value: any) => {
    const lawKey = `law${lawNumber}_${laws[lawNumber - 1].subtitle.toLowerCase()}` as keyof LawDesign;
    
    setDesignData(prev => ({
      ...prev,
      [lawKey]: {
        ...prev[lawKey],
        [field]: value,
      },
    }));
  };

  const addArrayItem = (lawNumber: 1 | 2 | 3 | 4, field: string) => {
    const lawKey = `law${lawNumber}_${laws[lawNumber - 1].subtitle.toLowerCase()}` as keyof LawDesign;
    const currentData = designData[lawKey] as any;
    
    setDesignData(prev => ({
      ...prev,
      [lawKey]: {
        ...prev[lawKey],
        [field]: [...currentData[field], ''],
      },
    }));
  };

  const removeArrayItem = (lawNumber: 1 | 2 | 3 | 4, field: string, index: number) => {
    const lawKey = `law${lawNumber}_${laws[lawNumber - 1].subtitle.toLowerCase()}` as keyof LawDesign;
    const currentData = designData[lawKey] as any;
    
    setDesignData(prev => ({
      ...prev,
      [lawKey]: {
        ...prev[lawKey],
        [field]: currentData[field].filter((_: any, i: number) => i !== index),
      },
    }));
  };

  const updateArrayItem = (lawNumber: 1 | 2 | 3 | 4, field: string, index: number, value: string) => {
    const lawKey = `law${lawNumber}_${laws[lawNumber - 1].subtitle.toLowerCase()}` as keyof LawDesign;
    const currentData = designData[lawKey] as any;
    const updated = [...currentData[field]];
    updated[index] = value;
    
    setDesignData(prev => ({
      ...prev,
      [lawKey]: {
        ...prev[lawKey],
        [field]: updated,
      },
    }));
  };

  const renderLawTabs = () => (
    <View style={styles.lawTabs}>
      {laws.map((law) => (
        <TouchableOpacity
          key={law.number}
          style={[
            styles.lawTab,
            selectedLaw === law.number && [styles.lawTabSelected, { borderBottomColor: law.color }],
          ]}
          onPress={() => setSelectedLaw(law.number as 1 | 2 | 3 | 4)}
        >
          <View style={[styles.lawTabIcon, { backgroundColor: law.color }]}>
            <Ionicons name={law.icon} size={16} color="white" />
          </View>
          <Text style={[
            styles.lawTabText,
            selectedLaw === law.number && styles.lawTabTextSelected,
          ]}>
            {law.number}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderLaw1Content = () => (
    <View style={styles.lawContent}>
      <Text style={styles.lawTitle}>Law 1: Make It Obvious</Text>
      <Text style={styles.lawDescription}>
        Design your environment to make the cue for your habit obvious.
      </Text>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Implementation Intention</Text>
        <Text style={styles.inputHint}>
          "I will [HABIT] at [TIME] in [LOCATION]"
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder={`I will ${habit.title.toLowerCase()} at 7:00 AM in my bedroom`}
          value={designData.law1_obvious.implementationIntention}
          onChangeText={(text) => updateDesignData(1, 'implementationIntention', text)}
          multiline
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Visual Cues</Text>
        <Text style={styles.inputHint}>
          What visual reminders will trigger this habit?
        </Text>
        {designData.law1_obvious.visualCues.map((cue, index) => (
          <View key={index} style={styles.arrayInputRow}>
            <TextInput
              style={[styles.textInput, styles.arrayInput]}
              placeholder={`Visual cue ${index + 1}`}
              value={cue}
              onChangeText={(text) => updateArrayItem(1, 'visualCues', index, text)}
            />
            {designData.law1_obvious.visualCues.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeArrayItem(1, 'visualCues', index)}
              >
                <Ionicons name="close" size={16} color="#F44336" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => addArrayItem(1, 'visualCues')}
        >
          <Ionicons name="add" size={16} color="#2196F3" />
          <Text style={styles.addButtonText}>Add Visual Cue</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Environment Design</Text>
        <Text style={styles.inputHint}>
          How will you restructure your environment?
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="Place workout clothes beside my bed"
          value={designData.law1_obvious.environmentDesign}
          onChangeText={(text) => updateDesignData(1, 'environmentDesign', text)}
          multiline
        />
      </View>
    </View>
  );

  const renderLaw2Content = () => (
    <View style={styles.lawContent}>
      <Text style={styles.lawTitle}>Law 2: Make It Attractive</Text>
      <Text style={styles.lawDescription}>
        Bundle your habit with something you enjoy to create craving.
      </Text>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Temptation Bundling</Text>
        <Text style={styles.inputHint}>
          Pair your habit with something you want to do
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="After I put on workout clothes, I will listen to my favorite podcast"
          value={designData.law2_attractive.bundledActivity}
          onChangeText={(text) => updateDesignData(2, 'bundledActivity', text)}
          multiline
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Social Environment</Text>
        <Text style={styles.inputHint}>
          How will you make this habit social?
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="Join a group where this behavior is normal"
          value={designData.law2_attractive.socialElement}
          onChangeText={(text) => updateDesignData(2, 'socialElement', text)}
          multiline
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Reframing</Text>
        <Text style={styles.inputHint}>
          Change your mindset about the habit
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="Instead of 'I have to exercise' think 'I get to build strength'"
          value={designData.law2_attractive.reframing}
          onChangeText={(text) => updateDesignData(2, 'reframing', text)}
          multiline
        />
      </View>
    </View>
  );

  const renderLaw3Content = () => (
    <View style={styles.lawContent}>
      <Text style={styles.lawTitle}>Law 3: Make It Easy</Text>
      <Text style={styles.lawDescription}>
        Reduce friction and use the 2-minute rule to make habits easy.
      </Text>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>2-Minute Version</Text>
        <Text style={styles.inputHint}>
          What's the 2-minute version of this habit?
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="Put on workout clothes"
          value={designData.law3_easy.twoMinuteVersion}
          onChangeText={(text) => updateDesignData(3, 'twoMinuteVersion', text)}
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Scaling Plan</Text>
        <Text style={styles.inputHint}>
          How will you gradually increase the habit?
        </Text>
        {designData.law3_easy.scalingPlan.map((step, index) => (
          <View key={index} style={styles.arrayInputRow}>
            <Text style={styles.stepNumber}>{index + 1}.</Text>
            <TextInput
              style={[styles.textInput, styles.arrayInput]}
              placeholder={`Step ${index + 1}`}
              value={step}
              onChangeText={(text) => updateArrayItem(3, 'scalingPlan', index, text)}
            />
            {designData.law3_easy.scalingPlan.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeArrayItem(3, 'scalingPlan', index)}
              >
                <Ionicons name="close" size={16} color="#F44336" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => addArrayItem(3, 'scalingPlan')}
        >
          <Ionicons name="add" size={16} color="#4CAF50" />
          <Text style={styles.addButtonText}>Add Step</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Friction Reduction</Text>
        <Text style={styles.inputHint}>
          How will you remove obstacles?
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="Prepare everything the night before"
          value={designData.law3_easy.frictionReduction}
          onChangeText={(text) => updateDesignData(3, 'frictionReduction', text)}
          multiline
        />
      </View>
    </View>
  );

  const renderLaw4Content = () => (
    <View style={styles.lawContent}>
      <Text style={styles.lawTitle}>Law 4: Make It Satisfying</Text>
      <Text style={styles.lawDescription}>
        Add immediate rewards to make the habit satisfying.
      </Text>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Immediate Reward</Text>
        <Text style={styles.inputHint}>
          What small reward will you give yourself?
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="Check off the habit and celebrate with a victory dance"
          value={designData.law4_satisfying.immediateReward}
          onChangeText={(text) => updateDesignData(4, 'immediateReward', text)}
          multiline
        />
      </View>

      <View style={styles.inputSection}>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.inputLabel}>Habit Tracker</Text>
            <Text style={styles.inputHint}>
              Track this habit visually
            </Text>
          </View>
          <Switch
            value={designData.law4_satisfying.habitTracker}
            onValueChange={(value) => updateDesignData(4, 'habitTracker', value)}
            trackColor={{ false: '#767577', true: '#FF9800' }}
            thumbColor={designData.law4_satisfying.habitTracker ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Celebration Ritual</Text>
        <Text style={styles.inputHint}>
          How will you celebrate completing this habit?
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="Say 'Yes!' and do a fist pump"
          value={designData.law4_satisfying.celebrationRitual}
          onChangeText={(text) => updateDesignData(4, 'celebrationRitual', text)}
          multiline
        />
      </View>
    </View>
  );

  const renderLawContent = () => {
    switch (selectedLaw) {
      case 1:
        return renderLaw1Content();
      case 2:
        return renderLaw2Content();
      case 3:
        return renderLaw3Content();
      case 4:
        return renderLaw4Content();
      default:
        return null;
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(designData);
    }
    Alert.alert('Success', '4 Laws design saved successfully!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>4 Laws of Behavior Change</Text>
        <Text style={styles.headerSubtitle}>Design your habit: {habit.title}</Text>
      </View>

      {renderLawTabs()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderLawContent()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Design</Text>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  lawTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
  },
  lawTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  lawTabSelected: {
    borderBottomWidth: 2,
  },
  lawTabIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  lawTabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  lawTabTextSelected: {
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  lawContent: {
    padding: theme.spacing.lg,
  },
  lawTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  lawDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  inputSection: {
    marginBottom: theme.spacing.xl,
  },
  inputLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  inputHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    minHeight: 44,
  },
  arrayInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  arrayInput: {
    flex: 1,
  },
  stepNumber: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
    minWidth: 20,
  },
  removeButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  addButton: {
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
  addButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSoft,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});