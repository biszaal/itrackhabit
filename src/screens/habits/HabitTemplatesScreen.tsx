import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NeumorphCard, NeumorphButton, NeumorphismColors } from '../../components/neumorphism';
import { RootStackScreenProps } from '../../types/navigation';
import { HABIT_TEMPLATES, HABIT_CATEGORIES, getTemplatesByCategory, HabitTemplate } from '../../data/habitTemplates';
import { theme } from '../../theme';

type HabitTemplatesScreenProps = RootStackScreenProps<'HabitTemplates'>;

export const HabitTemplatesScreen: React.FC<HabitTemplatesScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [templates] = useState(() => getTemplatesByCategory(selectedCategory));

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleTemplateSelect = (template: HabitTemplate) => {
    // Navigate to CreateEditHabitScreen with template data
    navigation.navigate('CreateEditHabit', { 
      template: {
        title: template.title,
        emoji: template.emoji,
        color: template.color,
        frequency: template.frequency,
        targetConfig: template.targetConfig,
        healthConfig: template.healthConfig,
        notes: template.notes,
        type: template.category,
      }
    });
  };

  const renderTemplateCard = (template: HabitTemplate) => (
    <TouchableOpacity
      key={template.id}
      onPress={() => handleTemplateSelect(template)}
      style={styles.templateCardContainer}
    >
      <NeumorphCard variant="subtle" colorType="whiteGlass" style={styles.templateCard} animated>
        <View style={styles.templateHeader}>
          <View style={styles.templateIcon}>
            <Text style={styles.templateEmoji}>{template.emoji}</Text>
          </View>
          <View style={[styles.colorIndicator, { backgroundColor: template.color }]} />
        </View>
        
        <Text style={styles.templateTitle}>{template.title}</Text>
        <Text style={styles.templateDescription}>{template.description}</Text>
        
        <View style={styles.templateMeta}>
          <View style={styles.targetInfo}>
            <Text style={styles.targetText}>
              {template.targetConfig.targetValue} {template.targetConfig.unit}
            </Text>
            <Text style={styles.frequencyText}>{template.frequency}</Text>
          </View>
          
          <View style={styles.tagsContainer}>
            {template.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </NeumorphCard>
    </TouchableOpacity>
  );

  const currentTemplates = getTemplatesByCategory(selectedCategory);

  return (
    <View style={[styles.container, { backgroundColor: NeumorphismColors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        {/* Header */}
        <NeumorphCard 
          variant="subtle" 
          colorType="whiteGlass" 
          style={[styles.header, { marginTop: insets.top - 45, paddingTop: 0 }]} 
          animated
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Habit Templates</Text>
          <View style={styles.placeholder} />
        </NeumorphCard>

        {/* Category Filter */}
        <View style={styles.categoryContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {HABIT_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategorySelect(category.id)}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                ]}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Templates Grid */}
        <ScrollView 
          style={styles.templatesContainer}
          contentContainerStyle={styles.templatesContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'All Templates' : 
             HABIT_CATEGORIES.find(cat => cat.id === selectedCategory)?.name} 
            <Text style={styles.templateCount}> ({currentTemplates.length})</Text>
          </Text>
          
          <View style={styles.templatesGrid}>
            {currentTemplates.map(renderTemplateCard)}
          </View>

          {/* Custom Habit Option */}
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateEditHabit', {})}
            style={styles.customHabitContainer}
          >
            <NeumorphCard variant="medium" colorType="whiteGlass" style={styles.customHabitCard} animated>
              <View style={styles.customHabitContent}>
                <Ionicons name="add-circle-outline" size={32} color="#666" />
                <Text style={styles.customHabitTitle}>Create Custom Habit</Text>
                <Text style={styles.customHabitDescription}>
                  Build your own habit from scratch
                </Text>
              </View>
            </NeumorphCard>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
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
    height: 64,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  categoryContainer: {
    paddingVertical: theme.spacing.md,
  },
  categoryScroll: {
    paddingHorizontal: theme.spacing.lg,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  categoryText: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    fontWeight: theme.fontWeight.medium,
  },
  categoryTextActive: {
    color: '#333',
    fontWeight: theme.fontWeight.semibold,
  },
  templatesContainer: {
    flex: 1,
  },
  templatesContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    marginBottom: theme.spacing.lg,
  },
  templateCount: {
    color: '#666',
    fontWeight: theme.fontWeight.normal,
  },
  templatesGrid: {
    gap: theme.spacing.md,
  },
  templateCardContainer: {
    marginBottom: theme.spacing.md,
  },
  templateCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  templateEmoji: {
    fontSize: 24,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  templateTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    marginBottom: theme.spacing.xs,
  },
  templateDescription: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  templateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  targetInfo: {
    flex: 1,
  },
  targetText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
  },
  frequencyText: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    textTransform: 'capitalize',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  tag: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: theme.fontSize.xs,
    color: '#666',
    fontWeight: theme.fontWeight.medium,
  },
  customHabitContainer: {
    marginTop: theme.spacing.xl,
  },
  customHabitCard: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  customHabitContent: {
    alignItems: 'center',
  },
  customHabitTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  customHabitDescription: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    textAlign: 'center',
  },
});