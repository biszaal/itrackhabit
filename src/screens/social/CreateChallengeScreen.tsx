import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { challengeService } from '../../services/social';
import { badgeService } from '../../services/premium';
import { CreateChallengeRequest } from '../../types';

interface CreateChallengeScreenProps {
  navigation: any;
}

export const CreateChallengeScreen: React.FC<CreateChallengeScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState<CreateChallengeRequest>({
    title: '',
    description: '',
    habitType: '',
    targetValue: 1,
    targetUnit: '',
    durationDays: 30,
    isPublic: false,
    maxParticipants: undefined,
  });
  const [loading, setLoading] = useState(false);

  const handleCreateChallenge = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a challenge title');
      return;
    }

    if (!formData.habitType.trim()) {
      Alert.alert('Error', 'Please enter a habit type');
      return;
    }

    if (!formData.targetUnit.trim()) {
      Alert.alert('Error', 'Please enter a target unit');
      return;
    }

    if (formData.targetValue <= 0) {
      Alert.alert('Error', 'Please enter a valid target value');
      return;
    }

    setLoading(true);
    try {
      await challengeService.createChallenge(formData);
      
      // Award badge for creating first challenge
      // await badgeService.checkChallengeBadges('creation');
      
      Alert.alert(
        'Success',
        'Challenge created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create challenge:', error);
      Alert.alert('Error', 'Failed to create challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const habitTypeOptions = [
    { label: 'Read Books', value: 'reading', unit: 'pages' },
    { label: 'Exercise', value: 'exercise', unit: 'minutes' },
    { label: 'Meditation', value: 'meditation', unit: 'minutes' },
    { label: 'Water Intake', value: 'hydration', unit: 'glasses' },
    { label: 'Steps', value: 'walking', unit: 'steps' },
    { label: 'Study', value: 'learning', unit: 'minutes' },
    { label: 'Sleep', value: 'sleep', unit: 'hours' },
  ];

  const durationOptions = [
    { label: '1 Week', value: 7 },
    { label: '2 Weeks', value: 14 },
    { label: '30 Days', value: 30 },
    { label: '60 Days', value: 60 },
    { label: '90 Days', value: 90 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Challenge</Text>
        <TouchableOpacity 
          onPress={handleCreateChallenge}
          disabled={loading}
        >
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            {loading ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challenge Details</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 30-Day Reading Challenge"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your challenge..."
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habit Type</Text>
          
          <View style={styles.optionsGrid}>
            {habitTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  formData.habitType === option.value && styles.optionCardSelected
                ]}
                onPress={() => setFormData(prev => ({
                  ...prev,
                  habitType: option.value,
                  targetUnit: option.unit
                }))}
              >
                <Text style={[
                  styles.optionText,
                  formData.habitType === option.value && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {formData.habitType && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Daily Target *</Text>
              <View style={styles.targetContainer}>
                <TextInput
                  style={[styles.input, styles.targetInput]}
                  placeholder="10"
                  value={formData.targetValue.toString()}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    targetValue: parseInt(text) || 1
                  }))}
                  keyboardType="numeric"
                />
                <Text style={styles.targetUnit}>{formData.targetUnit}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          
          <View style={styles.optionsRow}>
            {durationOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.durationOption,
                  formData.durationDays === option.value && styles.durationOptionSelected
                ]}
                onPress={() => setFormData(prev => ({
                  ...prev,
                  durationDays: option.value
                }))}
              >
                <Text style={[
                  styles.durationText,
                  formData.durationDays === option.value && styles.durationTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Public Challenge</Text>
              <Text style={styles.settingDescription}>
                Anyone can discover and join this challenge
              </Text>
            </View>
            <Switch
              value={formData.isPublic}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                isPublic: value
              }))}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={formData.isPublic ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Max Participants (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Leave empty for unlimited"
              value={formData.maxParticipants?.toString() || ''}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                maxParticipants: text ? parseInt(text) : undefined
              }))}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.bottomPadding} />
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
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  saveButton: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  saveButtonDisabled: {
    color: theme.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  optionCard: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minWidth: '45%',
    alignItems: 'center',
  },
  optionCardSelected: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  optionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  optionTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetInput: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  targetUnit: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  durationOption: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  durationOptionSelected: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  durationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  durationTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  bottomPadding: {
    height: theme.spacing.xxl,
  },
});