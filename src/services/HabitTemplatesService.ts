import { FrequencyType, HabitType } from '../types';

export interface HabitTemplate {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: string;
  frequency: FrequencyType;
  type: HabitType;
  isFavorite: boolean;
  tags: string[];
  estimatedTime?: number; // in minutes
}

export interface HabitCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  templates: HabitTemplate[];
}

class HabitTemplatesService {
  private categories: HabitCategory[] = [
    {
      id: 'fitness',
      name: 'Fitness',
      icon: '💪',
      color: '#FF6B6B',
      templates: [
        {
          id: 'walk',
          icon: '🚶',
          title: 'Daily Walk',
          description: 'Take a 30-minute walk for better health',
          category: 'fitness',
          frequency: 'daily',
          type: 'manual',
          isFavorite: true,
          tags: ['cardio', 'outdoor', 'low-impact'],
          estimatedTime: 30,
        },
        {
          id: 'exercise',
          icon: '🏃',
          title: 'Exercise',
          description: 'Get your heart pumping with cardio or strength training',
          category: 'fitness',
          frequency: 'daily',
          type: 'manual',
          isFavorite: true,
          tags: ['cardio', 'strength', 'endurance'],
          estimatedTime: 45,
        },
        {
          id: 'yoga',
          icon: '🧘',
          title: 'Yoga Practice',
          description: 'Improve flexibility and mindfulness',
          category: 'fitness',
          frequency: 'daily',
          type: 'manual',
          isFavorite: false,
          tags: ['flexibility', 'mindfulness', 'balance'],
          estimatedTime: 20,
        },
        {
          id: 'pushups',
          icon: '💪',
          title: 'Push-ups',
          description: 'Build upper body strength with push-ups',
          category: 'fitness',
          frequency: 'daily',
          type: 'manual',
          isFavorite: false,
          tags: ['strength', 'bodyweight', 'upper-body'],
          estimatedTime: 10,
        },
      ],
    },
    {
      id: 'wellness',
      name: 'Wellness',
      icon: '🧠',
      color: '#4ECDC4',
      templates: [
        {
          id: 'meditate',
          icon: '🧘‍♀️',
          title: 'Meditation',
          description: 'Practice mindfulness and reduce stress',
          category: 'wellness',
          frequency: 'daily',
          type: 'manual',
          isFavorite: true,
          tags: ['mindfulness', 'stress-relief', 'mental-health'],
          estimatedTime: 15,
        },
        {
          id: 'sleep',
          icon: '😴',
          title: 'Quality Sleep',
          description: 'Get 7-8 hours of restful sleep',
          category: 'wellness',
          frequency: 'daily',
          type: 'health',
          isFavorite: true,
          tags: ['recovery', 'health', 'energy'],
          estimatedTime: 480,
        },
        {
          id: 'water',
          icon: '💧',
          title: 'Hydration',
          description: 'Drink 8 glasses of water daily',
          category: 'wellness',
          frequency: 'daily',
          type: 'manual',
          isFavorite: false,
          tags: ['health', 'hydration', 'energy'],
          estimatedTime: 5,
        },
        {
          id: 'vitamins',
          icon: '💊',
          title: 'Take Vitamins',
          description: 'Remember your daily supplements',
          category: 'wellness',
          frequency: 'daily',
          type: 'manual',
          isFavorite: false,
          tags: ['health', 'nutrition', 'supplements'],
          estimatedTime: 2,
        },
      ],
    },
    {
      id: 'learning',
      name: 'Learning',
      icon: '📚',
      color: '#45B7D1',
      templates: [
        {
          id: 'read',
          icon: '📖',
          title: 'Reading',
          description: 'Read for 30 minutes to expand your knowledge',
          category: 'learning',
          frequency: 'daily',
          type: 'manual',
          isFavorite: true,
          tags: ['education', 'personal-growth', 'knowledge'],
          estimatedTime: 30,
        },
        {
          id: 'language',
          icon: '🗣️',
          title: 'Language Learning',
          description: 'Practice a new language for 20 minutes',
          category: 'learning',
          frequency: 'daily',
          type: 'manual',
          isFavorite: false,
          tags: ['language', 'communication', 'culture'],
          estimatedTime: 20,
        },
        {
          id: 'podcast',
          icon: '🎧',
          title: 'Listen to Podcast',
          description: 'Learn something new through podcasts',
          category: 'learning',
          frequency: 'daily',
          type: 'manual',
          isFavorite: false,
          tags: ['education', 'entertainment', 'multitasking'],
          estimatedTime: 25,
        },
        {
          id: 'skill',
          icon: '🎯',
          title: 'Practice Skill',
          description: 'Dedicate time to developing a specific skill',
          category: 'learning',
          frequency: 'daily',
          type: 'manual',
          isFavorite: false,
          tags: ['skill-building', 'practice', 'improvement'],
          estimatedTime: 30,
        },
      ],
    },
    {
      id: 'productivity',
      name: 'Productivity',
      icon: '⚡',
      color: '#FFA726',
      templates: [
        {
          id: 'journal',
          icon: '📝',
          title: 'Daily Journal',
          description: 'Reflect on your day and thoughts',
          category: 'productivity',
          frequency: 'daily',
          type: 'manual',
          isFavorite: false,
          tags: ['reflection', 'writing', 'self-awareness'],
          estimatedTime: 15,
        },
        {
          id: 'plan',
          icon: '📅',
          title: 'Plan Tomorrow',
          description: 'Prepare for the next day',
          category: 'productivity',
          frequency: 'daily',
          type: 'manual',
          isFavorite: false,
          tags: ['planning', 'organization', 'preparation'],
          estimatedTime: 10,
        },
        {
          id: 'declutter',
          icon: '🧹',
          title: 'Declutter Space',
          description: 'Organize and clean your environment',
          category: 'productivity',
          frequency: 'weekly',
          type: 'manual',
          isFavorite: false,
          tags: ['organization', 'cleaning', 'environment'],
          estimatedTime: 30,
        },
      ],
    },
    {
      id: 'social',
      name: 'Social',
      icon: '👥',
      color: '#AB47BC',
      templates: [
        {
          id: 'family',
          icon: '👨‍👩‍👧‍👦',
          title: 'Connect with Family',
          description: 'Spend quality time with family members',
          category: 'social',
          frequency: 'daily',
          type: 'manual',
          isFavorite: false,
          tags: ['relationships', 'family', 'connection'],
          estimatedTime: 60,
        },
        {
          id: 'friends',
          icon: '👯',
          title: 'Reach Out to Friends',
          description: 'Call or message a friend',
          category: 'social',
          frequency: 'weekly',
          type: 'manual',
          isFavorite: false,
          tags: ['friendship', 'communication', 'social'],
          estimatedTime: 20,
        },
        {
          id: 'gratitude',
          icon: '🙏',
          title: 'Practice Gratitude',
          description: 'Write down 3 things you\'re grateful for',
          category: 'social',
          frequency: 'daily',
          type: 'manual',
          isFavorite: false,
          tags: ['gratitude', 'positivity', 'mindfulness'],
          estimatedTime: 5,
        },
      ],
    },
  ];

  getAllCategories(): HabitCategory[] {
    return this.categories;
  }

  getCategoryById(categoryId: string): HabitCategory | undefined {
    return this.categories.find(cat => cat.id === categoryId);
  }

  getTemplateById(templateId: string): HabitTemplate | undefined {
    for (const category of this.categories) {
      const template = category.templates.find(t => t.id === templateId);
      if (template) return template;
    }
    return undefined;
  }

  getFavoriteTemplates(): HabitTemplate[] {
    const favorites: HabitTemplate[] = [];
    for (const category of this.categories) {
      favorites.push(...category.templates.filter(t => t.isFavorite));
    }
    return favorites;
  }

  getTemplatesByCategory(categoryId: string): HabitTemplate[] {
    const category = this.getCategoryById(categoryId);
    return category ? category.templates : [];
  }

  searchTemplates(query: string): HabitTemplate[] {
    const results: HabitTemplate[] = [];
    const searchTerm = query.toLowerCase();

    for (const category of this.categories) {
      for (const template of category.templates) {
        if (
          template.title.toLowerCase().includes(searchTerm) ||
          template.description.toLowerCase().includes(searchTerm) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        ) {
          results.push(template);
        }
      }
    }

    return results;
  }

  getRecommendedTemplates(userHabits: string[] = []): HabitTemplate[] {
    // Return templates that user doesn't already have
    const allTemplates = this.getAllTemplates();
    const userHabitTitles = userHabits.map(h => h.toLowerCase());
    
    return allTemplates.filter(template => 
      !userHabitTitles.includes(template.title.toLowerCase())
    ).slice(0, 6); // Return top 6 recommendations
  }

  private getAllTemplates(): HabitTemplate[] {
    const templates: HabitTemplate[] = [];
    for (const category of this.categories) {
      templates.push(...category.templates);
    }
    return templates;
  }
}

export const habitTemplatesService = new HabitTemplatesService();