export interface HabitTemplate {
  id: string;
  title: string;
  description: string;
  category: 'health' | 'productivity' | 'mindfulness' | 'learning' | 'social' | 'creative';
  /**
   * Name of a glyph from `components/art`. Stored on the habit's `emoji` column
   * when a template is used — the column kept its name, but nothing writes an
   * emoji to it any more; legacy values are translated on read by resolveGlyph.
   */
  emoji: string;
  color: string;
  frequency: 'daily' | 'weekly';
  targetConfig: {
    hasTarget: boolean;
    targetValue: number;
    unit: string;
    isTimeBased: boolean;
  };
  healthConfig?: {
    metricType: string;
    targetValue: number;
    unit: string;
    autoTrack: boolean;
  };
  notes?: string;
  tags: string[];
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // Health & Fitness
  {
    id: 'morning_workout',
    title: 'Morning Workout',
    description: 'Start your day with 30 minutes of exercise',
    category: 'health',
    emoji: 'strength',
    color: '#FF6B6B',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 30,
      unit: 'minutes',
      isTimeBased: true,
    },
    healthConfig: {
      metricType: 'exercise_minutes',
      targetValue: 30,
      unit: 'minutes',
      autoTrack: false,
    },
    notes: 'Mix cardio and strength training for best results',
    tags: ['fitness', 'morning', 'energy'],
  },
  {
    id: 'drink_water',
    title: 'Drink Water',
    description: 'Stay hydrated with 8 glasses of water daily',
    category: 'health',
    emoji: 'water',
    color: '#4ECDC4',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 8,
      unit: 'glasses',
      isTimeBased: false,
    },
    notes: 'Track throughout the day for optimal hydration',
    tags: ['health', 'hydration', 'wellness'],
  },
  {
    id: 'walk_10k_steps',
    title: 'Walk 10,000 Steps',
    description: 'Daily step goal for active lifestyle',
    category: 'health',
    emoji: 'walk',
    color: '#95E1D3',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 10000,
      unit: 'steps',
      isTimeBased: false,
    },
    healthConfig: {
      metricType: 'step_count',
      targetValue: 10000,
      unit: 'steps',
      autoTrack: true,
    },
    tags: ['fitness', 'walking', 'daily'],
  },

  // Mindfulness & Mental Health
  {
    id: 'meditation',
    title: 'Meditation',
    description: 'Daily mindfulness practice for inner peace',
    category: 'mindfulness',
    emoji: 'meditate',
    color: '#A8B5A0',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 15,
      unit: 'minutes',
      isTimeBased: true,
    },
    notes: 'Start with 5 minutes and gradually increase',
    tags: ['mindfulness', 'peace', 'focus'],
  },
  {
    id: 'gratitude_journal',
    title: 'Gratitude Journal',
    description: 'Write down 3 things you\'re grateful for',
    category: 'mindfulness',
    emoji: 'journal',
    color: '#F8B500',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 3,
      unit: 'entries',
      isTimeBased: false,
    },
    notes: 'Focus on specific details to enhance gratitude',
    tags: ['gratitude', 'journaling', 'positivity'],
  },
  {
    id: 'deep_breathing',
    title: 'Deep Breathing',
    description: 'Breathing exercises for stress relief',
    category: 'mindfulness',
    emoji: 'breathe',
    color: '#B4A5E8',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 10,
      unit: 'minutes',
      isTimeBased: true,
    },
    notes: 'Practice 4-7-8 breathing technique',
    tags: ['breathing', 'stress-relief', 'calm'],
  },

  // Learning & Growth
  {
    id: 'read_book',
    title: 'Reading',
    description: 'Daily reading for continuous learning',
    category: 'learning',
    emoji: 'study',
    color: '#6C5CE7',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 30,
      unit: 'minutes',
      isTimeBased: true,
    },
    notes: 'Mix fiction and non-fiction for balanced growth',
    tags: ['reading', 'learning', 'growth'],
  },
  {
    id: 'learn_language',
    title: 'Language Learning',
    description: 'Practice a new language daily',
    category: 'learning',
    emoji: 'language',
    color: '#FD79A8',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 20,
      unit: 'minutes',
      isTimeBased: true,
    },
    notes: 'Use apps like Duolingo or practice conversations',
    tags: ['language', 'learning', 'culture'],
  },
  {
    id: 'skill_practice',
    title: 'Skill Practice',
    description: 'Dedicated time for developing new skills',
    category: 'learning',
    emoji: 'target',
    color: '#00B894',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 45,
      unit: 'minutes',
      isTimeBased: true,
    },
    notes: 'Focus on deliberate practice techniques',
    tags: ['skill', 'practice', 'improvement'],
  },

  // Productivity
  {
    id: 'morning_routine',
    title: 'Morning Routine',
    description: 'Complete morning routine checklist',
    category: 'productivity',
    emoji: 'sunrise',
    color: '#FDCB6E',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 1,
      unit: 'routine',
      isTimeBased: false,
    },
    notes: 'Include wake up time, exercise, breakfast, planning',
    tags: ['morning', 'routine', 'productivity'],
  },
  {
    id: 'no_social_media',
    title: 'Social Media Detox',
    description: 'Avoid social media for focused work time',
    category: 'productivity',
    emoji: 'offline',
    color: '#E17055',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 4,
      unit: 'hours',
      isTimeBased: true,
    },
    notes: 'Use app blockers to maintain focus',
    tags: ['detox', 'focus', 'digital-wellness'],
  },
  {
    id: 'plan_tomorrow',
    title: 'Plan Tomorrow',
    description: 'Evening planning for next day\'s priorities',
    category: 'productivity',
    emoji: 'plan',
    color: '#0984E3',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 1,
      unit: 'session',
      isTimeBased: false,
    },
    notes: 'List 3 most important tasks for tomorrow',
    tags: ['planning', 'organization', 'evening'],
  },

  // Creative & Social
  {
    id: 'creative_writing',
    title: 'Creative Writing',
    description: 'Daily writing practice for creativity',
    category: 'creative',
    emoji: 'write',
    color: '#A29BFE',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 25,
      unit: 'minutes',
      isTimeBased: true,
    },
    notes: 'Try prompts or free writing exercises',
    tags: ['writing', 'creativity', 'expression'],
  },
  {
    id: 'call_family',
    title: 'Call Family',
    description: 'Stay connected with family members',
    category: 'social',
    emoji: 'call',
    color: '#FF7675',
    frequency: 'weekly',
    targetConfig: {
      hasTarget: true,
      targetValue: 2,
      unit: 'calls',
      isTimeBased: false,
    },
    notes: 'Schedule regular check-ins with loved ones',
    tags: ['family', 'connection', 'relationships'],
  },
  {
    id: 'practice_instrument',
    title: 'Practice Instrument',
    description: 'Daily music practice session',
    category: 'creative',
    emoji: 'music',
    color: '#74B9FF',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 30,
      unit: 'minutes',
      isTimeBased: true,
    },
    notes: 'Focus on scales, songs, and technique',
    tags: ['music', 'practice', 'creativity'],
  },

  // Sleep & Rest
  {
    id: 'sleep_schedule',
    title: 'Consistent Sleep',
    description: 'Maintain regular sleep schedule',
    category: 'health',
    emoji: 'sleep',
    color: '#6C5CE7',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 8,
      unit: 'hours',
      isTimeBased: true,
    },
    healthConfig: {
      metricType: 'sleep_hours',
      targetValue: 8,
      unit: 'hours',
      autoTrack: true,
    },
    notes: 'Aim for consistent bedtime and wake time',
    tags: ['sleep', 'health', 'routine'],
  },

  // Additional Learning Habits
  {
    id: 'online_course',
    title: 'Online Course',
    description: 'Complete daily lessons or modules',
    category: 'learning',
    emoji: 'learn',
    color: '#9333EA',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 1,
      unit: 'lesson',
      isTimeBased: false,
    },
    notes: 'Track your learning progress systematically',
    tags: ['education', 'skills', 'online'],
  },
  {
    id: 'coding_practice',
    title: 'Coding Practice',
    description: 'Practice programming skills daily',
    category: 'learning',
    emoji: 'code',
    color: '#059669',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 60,
      unit: 'minutes',
      isTimeBased: true,
    },
    notes: 'Focus on algorithms, data structures, or new technologies',
    tags: ['programming', 'technology', 'skills'],
  },

  // Additional Health Habits
  {
    id: 'stretching',
    title: 'Stretching',
    description: 'Daily stretching routine for flexibility',
    category: 'health',
    emoji: 'stretch',
    color: '#DC2626',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 15,
      unit: 'minutes',
      isTimeBased: true,
    },
    notes: 'Focus on different muscle groups each day',
    tags: ['flexibility', 'mobility', 'recovery'],
  },
  {
    id: 'healthy_meal',
    title: 'Healthy Meal Prep',
    description: 'Prepare nutritious meals in advance',
    category: 'health',
    emoji: 'nutrition',
    color: '#16A34A',
    frequency: 'weekly',
    targetConfig: {
      hasTarget: true,
      targetValue: 3,
      unit: 'meals',
      isTimeBased: false,
    },
    notes: 'Plan balanced meals with proteins, vegetables, and whole grains',
    tags: ['nutrition', 'meal-prep', 'health'],
  },

  // Additional Productivity Habits
  {
    id: 'inbox_zero',
    title: 'Inbox Zero',
    description: 'Clear and organize your email inbox',
    category: 'productivity',
    emoji: 'inbox',
    color: '#EA580C',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 1,
      unit: 'session',
      isTimeBased: false,
    },
    notes: 'Process emails using the 2-minute rule',
    tags: ['email', 'organization', 'productivity'],
  },
  {
    id: 'deep_work',
    title: 'Deep Work Session',
    description: 'Focused work without distractions',
    category: 'productivity',
    emoji: 'target',
    color: '#7C3AED',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 90,
      unit: 'minutes',
      isTimeBased: true,
    },
    notes: 'Turn off notifications and focus on high-value tasks',
    tags: ['focus', 'productivity', 'concentration'],
  },

  // Additional Creative Habits
  {
    id: 'photography',
    title: 'Photography Practice',
    description: 'Take and edit photos to improve skills',
    category: 'creative',
    emoji: 'photo',
    color: '#DB2777',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 10,
      unit: 'photos',
      isTimeBased: false,
    },
    notes: 'Experiment with different compositions and lighting',
    tags: ['photography', 'creativity', 'visual'],
  },
  {
    id: 'drawing',
    title: 'Drawing Practice',
    description: 'Sketch or draw to develop artistic skills',
    category: 'creative',
    emoji: 'write',
    color: '#0EA5E9',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 30,
      unit: 'minutes',
      isTimeBased: true,
    },
    notes: 'Practice basic shapes, shading, and perspective',
    tags: ['drawing', 'art', 'creativity'],
  },

  // Additional Social Habits
  {
    id: 'check_in_friend',
    title: 'Check In With Friend',
    description: 'Reach out to maintain relationships',
    category: 'social',
    emoji: 'chat',
    color: '#F59E0B',
    frequency: 'weekly',
    targetConfig: {
      hasTarget: true,
      targetValue: 1,
      unit: 'conversation',
      isTimeBased: false,
    },
    notes: 'Send a meaningful message or make a call',
    tags: ['friendship', 'relationships', 'communication'],
  },
  {
    id: 'volunteer',
    title: 'Volunteer Work',
    description: 'Give back to your community',
    category: 'social',
    emoji: 'people',
    color: '#10B981',
    frequency: 'weekly',
    targetConfig: {
      hasTarget: true,
      targetValue: 2,
      unit: 'hours',
      isTimeBased: true,
    },
    notes: 'Find causes that align with your values',
    tags: ['volunteering', 'community', 'giving'],
  },

  // Additional Mindfulness Habits
  {
    id: 'nature_walk',
    title: 'Nature Walk',
    description: 'Mindful walking in natural settings',
    category: 'mindfulness',
    emoji: 'nature',
    color: '#059669',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 20,
      unit: 'minutes',
      isTimeBased: true,
    },
    notes: 'Focus on your senses and surroundings',
    tags: ['nature', 'walking', 'mindfulness'],
  },
  {
    id: 'digital_detox',
    title: 'Digital Detox Hour',
    description: 'One hour without screens or devices',
    category: 'mindfulness',
    emoji: 'offline',
    color: '#DC2626',
    frequency: 'daily',
    targetConfig: {
      hasTarget: true,
      targetValue: 1,
      unit: 'hour',
      isTimeBased: true,
    },
    notes: 'Use this time for reading, reflection, or face-to-face interaction',
    tags: ['digital-wellness', 'mindfulness', 'presence'],
  },
];

export const HABIT_CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: 'templates' },
  { id: 'health', name: 'Health & Fitness', icon: 'strength' },
  { id: 'mindfulness', name: 'Mindfulness', icon: 'meditate' },
  { id: 'learning', name: 'Learning', icon: 'study' },
  { id: 'productivity', name: 'Productivity', icon: 'target' },
  { id: 'creative', name: 'Creative', icon: 'draw' },
  { id: 'social', name: 'Social', icon: 'people' },
];

export function getTemplatesByCategory(category: string): HabitTemplate[] {
  if (category === 'all') {
    return HABIT_TEMPLATES;
  }
  return HABIT_TEMPLATES.filter(template => template.category === category);
}

export function getTemplateById(id: string): HabitTemplate | undefined {
  return HABIT_TEMPLATES.find(template => template.id === id);
}

// Get templates by search query
export function searchTemplates(query: string): HabitTemplate[] {
  if (!query.trim()) return HABIT_TEMPLATES;
  
  const searchTerm = query.toLowerCase().trim();
  
  return HABIT_TEMPLATES.filter(template => 
    template.title.toLowerCase().includes(searchTerm) ||
    template.description.toLowerCase().includes(searchTerm) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    template.category.toLowerCase().includes(searchTerm)
  );
}

// Get popular templates (most commonly used)
export function getPopularTemplates(limit: number = 6): HabitTemplate[] {
  // For now, return a curated list of popular habits
  // In a real app, this would be based on user adoption data
  const popularIds = [
    'drink_water',
    'meditation',
    'morning_workout',
    'read_book',
    'gratitude_journal',
    'walk_10k_steps',
  ];
  
  return popularIds
    .map(id => getTemplateById(id))
    .filter(Boolean)
    .slice(0, limit) as HabitTemplate[];
}

// Get beginner-friendly templates
export function getBeginnerTemplates(): HabitTemplate[] {
  // Templates that are easy to start and maintain
  const beginnerIds = [
    'drink_water',
    'gratitude_journal',
    'deep_breathing',
    'nature_walk',
    'stretching',
    'digital_detox',
  ];
  
  return beginnerIds
    .map(id => getTemplateById(id))
    .filter(Boolean) as HabitTemplate[];
}

// Get templates by difficulty level
export function getTemplatesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): HabitTemplate[] {
  const difficultyMapping: Record<string, number> = {
    easy: 1,
    medium: 2, 
    hard: 3,
  };
  
  const targetDifficulty = difficultyMapping[difficulty];
  
  return HABIT_TEMPLATES.filter(template => {
    // Simple heuristic based on target value and time commitment
    let templateDifficulty = 1;
    
    if (template.targetConfig.isTimeBased) {
      const minutes = template.targetConfig.targetValue;
      if (minutes >= 60) templateDifficulty = 3;
      else if (minutes >= 30) templateDifficulty = 2;
    } else {
      const value = template.targetConfig.targetValue;
      if (value >= 10) templateDifficulty = 3;
      else if (value >= 5) templateDifficulty = 2;
    }
    
    return templateDifficulty === targetDifficulty;
  });
}

// Get recommended templates based on user's existing habits
export function getRecommendedTemplates(
  userHabits: string[], // Array of user's habit categories
  limit: number = 4
): HabitTemplate[] {
  if (userHabits.length === 0) {
    return getPopularTemplates(limit);
  }
  
  // Find complementary habits from different categories
  const userCategories = new Set(userHabits);
  const otherCategories = HABIT_CATEGORIES
    .map(cat => cat.id)
    .filter(catId => catId !== 'all' && !userCategories.has(catId));
  
  const recommendations: HabitTemplate[] = [];
  
  // Get one template from each complementary category
  otherCategories.forEach(categoryId => {
    const categoryTemplates = getTemplatesByCategory(categoryId);
    if (categoryTemplates.length > 0) {
      // Pick the most popular template from this category
      const popularInCategory = categoryTemplates.find(t => 
        ['drink_water', 'meditation', 'morning_workout', 'read_book'].includes(t.id)
      ) || categoryTemplates[0];
      
      if (recommendations.length < limit) {
        recommendations.push(popularInCategory);
      }
    }
  });
  
  // Fill remaining slots with popular templates
  if (recommendations.length < limit) {
    const popular = getPopularTemplates(limit - recommendations.length);
    recommendations.push(...popular.filter(p => 
      !recommendations.find(r => r.id === p.id)
    ));
  }
  
  return recommendations.slice(0, limit);
}

// Get templates by time commitment
export function getTemplatesByTimeCommitment(maxMinutes: number): HabitTemplate[] {
  return HABIT_TEMPLATES.filter(template => {
    if (!template.targetConfig.isTimeBased) return true; // Non-time based habits are included
    return template.targetConfig.targetValue <= maxMinutes;
  });
}

// Get habit statistics
export function getHabitTemplateStats(): {
  totalTemplates: number;
  categoryCounts: Record<string, number>;
  averageTimeCommitment: number;
  frequencyDistribution: Record<string, number>;
} {
  const categoryCounts: Record<string, number> = {};
  const frequencyDistribution: Record<string, number> = {};
  let totalTimeMinutes = 0;
  let timeBased = 0;
  
  HABIT_TEMPLATES.forEach(template => {
    // Category counts
    categoryCounts[template.category] = (categoryCounts[template.category] || 0) + 1;
    
    // Frequency distribution
    frequencyDistribution[template.frequency] = (frequencyDistribution[template.frequency] || 0) + 1;
    
    // Time commitment
    if (template.targetConfig.isTimeBased) {
      totalTimeMinutes += template.targetConfig.targetValue;
      timeBased++;
    }
  });
  
  return {
    totalTemplates: HABIT_TEMPLATES.length,
    categoryCounts,
    averageTimeCommitment: timeBased > 0 ? Math.round(totalTimeMinutes / timeBased) : 0,
    frequencyDistribution,
  };
}