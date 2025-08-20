/**
 * Atomic Habits Service - Core Implementation of James Clear's Framework
 * 
 * This service implements all key concepts from Atomic Habits:
 * - 4 Laws of Behavior Change (Cue, Craving, Response, Reward)
 * - Identity-Based Habit Formation
 * - 1% Improvements and Compound Growth
 * - Environment Design and Habit Stacking
 * - 2-Minute Rule and Progressive Scaling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit } from '../types';

// Core Atomic Habits Types
export interface IdentityStatement {
  id: string;
  statement: string; // "I am someone who..."
  category: 'health' | 'productivity' | 'learning' | 'relationships' | 'personal';
  supportingHabits: string[]; // habit IDs that support this identity
  createdAt: string;
}

export interface HabitStack {
  id: string;
  name: string;
  description: string;
  habits: StackedHabit[];
  trigger: 'time' | 'location' | 'completion'; // What triggers the stack
  triggerValue: string; // Time, location, or habit ID
}

export interface StackedHabit {
  habitId: string;
  order: number;
  isCore: boolean; // Core habits vs optional habits in stack
  minimumVersion: string; // 2-minute rule version
  fullVersion: string; // Full version to work up to
}

export interface EnvironmentDesign {
  id: string;
  habitId: string;
  designType: 'cue_obvious' | 'cue_hidden' | 'friction_reduced' | 'friction_added';
  description: string;
  location: string;
  implementation: string; // How to implement this design
}

export interface CompoundProgress {
  habitId: string;
  baselineValue: number;
  currentValue: number;
  improvementRate: number; // Daily % improvement
  compoundedGrowth: number; // Total compound growth
  projectedValue: number; // Where you'll be in X days
  daysSinceStart: number;
}

export interface BehaviorAnalysis {
  habitId: string;
  missPattern: 'weekend' | 'weekday' | 'random' | 'none';
  plateauDetected: boolean;
  plateauStartDate?: string;
  suggestionType: 'environment' | 'identity' | 'system' | 'reward';
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high'; // Risk of habit failure
}

class AtomicHabitsService {
  private static instance: AtomicHabitsService;
  
  public static getInstance(): AtomicHabitsService {
    if (!AtomicHabitsService.instance) {
      AtomicHabitsService.instance = new AtomicHabitsService();
    }
    return AtomicHabitsService.instance;
  }

  // =====================================
  // IDENTITY-BASED HABIT SYSTEM
  // =====================================

  async createIdentityStatement(category: string, goals: string[]): Promise<IdentityStatement> {
    const identityPrompts = {
      health: [
        "I am someone who prioritizes their physical well-being",
        "I am someone who treats their body with respect",
        "I am someone who makes healthy choices naturally"
      ],
      productivity: [
        "I am someone who uses time intentionally", 
        "I am someone who focuses deeply on important work",
        "I am someone who creates rather than consumes"
      ],
      learning: [
        "I am someone who grows every day",
        "I am someone who asks questions and seeks answers",
        "I am someone who turns knowledge into wisdom"
      ],
      relationships: [
        "I am someone who invests in meaningful connections",
        "I am someone who listens deeply and speaks kindly",
        "I am someone who shows up for the people I care about"
      ],
      personal: [
        "I am someone who keeps promises to myself",
        "I am someone who faces challenges with courage",
        "I am someone who builds systems for success"
      ]
    };

    const statement: IdentityStatement = {
      id: Date.now().toString(),
      statement: identityPrompts[category as keyof typeof identityPrompts][0],
      category: category as any,
      supportingHabits: [],
      createdAt: new Date().toISOString(),
    };

    const existing = await this.getIdentityStatements();
    await AsyncStorage.setItem('identity_statements', JSON.stringify([...existing, statement]));
    
    return statement;
  }

  async getIdentityStatements(): Promise<IdentityStatement[]> {
    try {
      const data = await AsyncStorage.getItem('identity_statements');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  async linkHabitToIdentity(habitId: string, identityId: string): Promise<void> {
    const identities = await this.getIdentityStatements();
    const identity = identities.find(i => i.id === identityId);
    
    if (identity && !identity.supportingHabits.includes(habitId)) {
      identity.supportingHabits.push(habitId);
      await AsyncStorage.setItem('identity_statements', JSON.stringify(identities));
    }
  }

  // =====================================
  // 1% IMPROVEMENT & COMPOUND GROWTH
  // =====================================

  calculateCompoundProgress(habit: Habit, logs: any[]): CompoundProgress {
    if (logs.length < 7) {
      return {
        habitId: habit.id,
        baselineValue: 0,
        currentValue: 0,
        improvementRate: 0,
        compoundedGrowth: 0,
        projectedValue: 0,
        daysSinceStart: logs.length,
      };
    }

    // Calculate average improvement rate over last 7 days
    const recent = logs.slice(-7);
    const baseline = recent[0].current_value || 0;
    const current = recent[recent.length - 1].current_value || 0;
    
    const improvementRate = baseline > 0 ? ((current - baseline) / baseline) * 100 / 7 : 0;
    const compoundedGrowth = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;
    
    // Project where they'll be in 30/90 days with 1% daily improvement
    const onePercentDaily = 1.01;
    const projected30Days = current * Math.pow(onePercentDaily, 30);
    
    return {
      habitId: habit.id,
      baselineValue: baseline,
      currentValue: current,
      improvementRate: Math.max(0.01, improvementRate), // Encourage at least 1%
      compoundedGrowth,
      projectedValue: projected30Days,
      daysSinceStart: logs.length,
    };
  }

  generateCompoundInsight(progress: CompoundProgress): string {
    const { improvementRate, projectedValue, currentValue } = progress;
    
    if (improvementRate >= 1) {
      return `🚀 Amazing! Your ${improvementRate.toFixed(1)}% daily improvement means you'll reach ${projectedValue.toFixed(0)} in 30 days. Small gains, massive results!`;
    } else if (improvementRate >= 0.5) {
      return `📈 You're on track! Even ${improvementRate.toFixed(1)}% daily improvement compounds to ${((projectedValue/currentValue - 1) * 100).toFixed(0)}% growth in a month.`;
    } else {
      return `💪 Focus on just 1% better each day. That tiny improvement becomes 37x better in a year through compound growth!`;
    }
  }

  // =====================================
  // 4 LAWS OF BEHAVIOR CHANGE
  // =====================================

  // LAW 1: MAKE IT OBVIOUS (Cue Design)
  async designObviousCues(habitId: string, currentEnvironment: string): Promise<EnvironmentDesign[]> {
    const cueDesigns: EnvironmentDesign[] = [
      {
        id: `${habitId}_cue_1`,
        habitId,
        designType: 'cue_obvious',
        description: 'Visual Trigger Placement',
        location: currentEnvironment,
        implementation: 'Place habit materials where you can see them immediately'
      },
      {
        id: `${habitId}_cue_2`, 
        habitId,
        designType: 'cue_obvious',
        description: 'Implementation Intention',
        location: 'Mental',
        implementation: 'Use "I will [HABIT] at [TIME] in [LOCATION]" format'
      },
      {
        id: `${habitId}_cue_3`,
        habitId,
        designType: 'cue_obvious',
        description: 'Environment Restructure', 
        location: currentEnvironment,
        implementation: 'Redesign space to make good choices the default option'
      }
    ];

    await AsyncStorage.setItem(`environment_designs_${habitId}`, JSON.stringify(cueDesigns));
    return cueDesigns;
  }

  // LAW 2: MAKE IT ATTRACTIVE (Craving Design)
  generateAttractivenessStrategies(habit: Habit): string[] {
    return [
      `Bundle ${habit.title} with something you enjoy (temptation bundling)`,
      `Join a group where ${habit.title} is the normal behavior`,
      `Reframe: Focus on benefits you gain, not what you're giving up`,
      `Create a ritual that makes starting ${habit.title} feel special`,
      `Use social accountability - share your progress publicly`,
      `Pair ${habit.title} with your favorite music, podcast, or environment`
    ];
  }

  // LAW 3: MAKE IT EASY (Response Design) 
  implementTwoMinuteRule(habit: Habit): { miniVersion: string; scalingPlan: string[] } {
    const twoMinuteVersions: { [key: string]: { mini: string; scaling: string[] } } = {
      'exercise': {
        mini: 'Put on workout clothes',
        scaling: ['Put on workout clothes', 'Do 1 push-up', 'Exercise for 2 minutes', 'Exercise for 5 minutes', 'Full 30-minute workout']
      },
      'reading': {
        mini: 'Read one page',
        scaling: ['Read one page', 'Read for 2 minutes', 'Read for 10 minutes', 'Read for 30 minutes', 'Read full chapter']
      },
      'meditation': {
        mini: 'Take one deep breath',
        scaling: ['Take one deep breath', 'Breathe mindfully for 1 minute', 'Meditate for 2 minutes', 'Meditate for 10 minutes', 'Meditate for 20 minutes']
      },
      'writing': {
        mini: 'Write one sentence',
        scaling: ['Write one sentence', 'Write for 2 minutes', 'Write one paragraph', 'Write for 15 minutes', 'Write full page']
      },
      'default': {
        mini: `Start ${habit.title} for just 2 minutes`,
        scaling: [`Start ${habit.title} for 2 minutes`, `Do ${habit.title} for 5 minutes`, `Do ${habit.title} for 15 minutes`, `Full ${habit.title} session`]
      }
    };

    const category = this.categorizeHabit(habit.title.toLowerCase());
    const plan = twoMinuteVersions[category] || twoMinuteVersions.default;
    
    return {
      miniVersion: plan.mini,
      scalingPlan: plan.scaling
    };
  }

  private categorizeHabit(title: string): string {
    if (title.includes('exercise') || title.includes('workout') || title.includes('run') || title.includes('walk')) return 'exercise';
    if (title.includes('read') || title.includes('book')) return 'reading';
    if (title.includes('meditat') || title.includes('mindful')) return 'meditation';
    if (title.includes('write') || title.includes('journal')) return 'writing';
    return 'default';
  }

  // LAW 4: MAKE IT SATISFYING (Reward Design)
  async createRewardSystem(habitId: string, completionData: any[]): Promise<{
    immediateReward: string;
    progressReward: string;
    socialReward: string;
    identityReward: string;
  }> {
    const streak = this.calculateCurrentStreak(completionData);
    
    return {
      immediateReward: this.getImmediateReward(streak),
      progressReward: `You've completed this habit ${completionData.length} times - you're building lasting change!`,
      socialReward: streak >= 7 ? 'Share your 7-day streak with friends!' : 'Tell someone about your progress today',
      identityReward: `Every completion reinforces: "I am someone who follows through on commitments"`
    };
  }

  private getImmediateReward(streak: number): string {
    if (streak >= 30) return '🏆 Incredible! 30+ day streak - you are unstoppable!';
    if (streak >= 14) return '🔥 Two weeks strong! This is becoming automatic!';
    if (streak >= 7) return '⭐ One week complete! You\'re building real momentum!';
    if (streak >= 3) return '💪 Three days in a row - momentum is building!';
    return '🎉 Great job! Each completion is a vote for your best self!';
  }

  // =====================================
  // HABIT STACKING SYSTEM
  // =====================================

  async createHabitStack(name: string, triggerHabit: Habit, newHabits: Habit[]): Promise<HabitStack> {
    const stack: HabitStack = {
      id: Date.now().toString(),
      name,
      description: `After I ${triggerHabit.title}, I will...`,
      habits: newHabits.map((habit, index) => ({
        habitId: habit.id,
        order: index + 1,
        isCore: index === 0, // First habit is core
        minimumVersion: this.implementTwoMinuteRule(habit).miniVersion,
        fullVersion: habit.title
      })),
      trigger: 'completion',
      triggerValue: triggerHabit.id
    };

    const stacks = await this.getHabitStacks();
    await AsyncStorage.setItem('habit_stacks', JSON.stringify([...stacks, stack]));
    
    return stack;
  }

  async getHabitStacks(): Promise<HabitStack[]> {
    try {
      const data = await AsyncStorage.getItem('habit_stacks');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  generateStackingSuggestions(existingHabits: Habit[]): string[] {
    const suggestions = [
      "After I pour my morning coffee, I will write three things I'm grateful for",
      "After I sit down at my desk, I will write my top priority for the day", 
      "After I put on my workout clothes, I will do two minutes of stretching",
      "After I brush my teeth at night, I will read one page of a book",
      "After I close my laptop, I will put my phone in another room",
      "After I wake up, I will make my bed immediately",
      "After I finish lunch, I will go for a 2-minute walk",
      "After I start my car, I will take three deep breaths"
    ];

    // Filter suggestions based on existing habits to avoid duplicates
    return suggestions.filter(suggestion => 
      !existingHabits.some(habit => 
        suggestion.toLowerCase().includes(habit.title.toLowerCase())
      )
    ).slice(0, 3);
  }

  // =====================================
  // NEVER MISS TWICE SYSTEM
  // =====================================

  analyzeMissPattern(logs: any[]): BehaviorAnalysis {
    const recentLogs = logs.slice(-14); // Last 14 days
    const missedDays = recentLogs.filter(log => log.status === 'missed' || log.status === 'skipped');
    
    const riskLevel = this.assessRiskLevel(missedDays, recentLogs);
    const missPattern = this.detectMissPattern(missedDays);
    const plateauDetected = this.detectPlateau(logs);
    
    return {
      habitId: logs[0]?.habit_id || '',
      missPattern,
      plateauDetected,
      plateauStartDate: plateauDetected ? this.findPlateauStart(logs) : undefined,
      suggestionType: this.selectSuggestionType(riskLevel, missPattern),
      suggestions: this.generateRecoverySuggestions(riskLevel, missPattern),
      riskLevel
    };
  }

  private assessRiskLevel(missedDays: any[], totalDays: any[]): 'low' | 'medium' | 'high' {
    const missRate = missedDays.length / totalDays.length;
    const consecutiveMisses = this.getConsecutiveMisses(totalDays);
    
    if (consecutiveMisses >= 2 || missRate > 0.4) return 'high';
    if (consecutiveMisses === 1 || missRate > 0.2) return 'medium';
    return 'low';
  }

  private getConsecutiveMisses(logs: any[]): number {
    let consecutive = 0;
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].status === 'missed' || logs[i].status === 'skipped') {
        consecutive++;
      } else {
        break;
      }
    }
    return consecutive;
  }

  private detectMissPattern(missedDays: any[]): 'weekend' | 'weekday' | 'random' | 'none' {
    if (missedDays.length === 0) return 'none';
    
    const weekendMisses = missedDays.filter(day => {
      const dayOfWeek = new Date(day.date).getDay();
      return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    }).length;
    
    const weekdayMisses = missedDays.length - weekendMisses;
    
    if (weekendMisses > weekdayMisses * 1.5) return 'weekend';
    if (weekdayMisses > weekendMisses * 1.5) return 'weekday';
    return 'random';
  }

  private detectPlateau(logs: any[]): boolean {
    if (logs.length < 14) return false;
    
    const recent = logs.slice(-14);
    const values = recent.map(log => log.current_value || 0);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    
    // Check if all recent values are within 5% of average (indicating plateau)
    return values.every(value => Math.abs(value - average) / average < 0.05);
  }

  private findPlateauStart(logs: any[]): string {
    // Simple implementation - find when values stopped improving significantly
    const cutoff = logs.slice(-21, -14); // 3 weeks ago
    return cutoff[0]?.date || logs[Math.max(0, logs.length - 14)].date;
  }

  private selectSuggestionType(riskLevel: 'low' | 'medium' | 'high', pattern: string): 'environment' | 'identity' | 'system' | 'reward' {
    if (riskLevel === 'high') return 'environment'; // Change environment first
    if (pattern === 'weekend') return 'system'; // Need better weekend system
    if (pattern === 'weekday') return 'environment'; // Work environment issues
    return 'identity'; // Reinforce identity
  }

  private generateRecoverySuggestions(riskLevel: 'low' | 'medium' | 'high', pattern: string): string[] {
    const suggestions = {
      high: [
        "🚨 Use the 2-minute rule - make it so easy you can't say no",
        "🔄 Change your environment - remove friction and barriers",
        "👥 Get an accountability partner to check in daily",
        "⚡ Focus on just showing up - success is getting started"
      ],
      medium: [
        "🎯 Never miss twice - if you missed today, absolutely do it tomorrow",
        "🏗️ Review your system - what made it hard to complete?", 
        "🎁 Add an immediate reward to make completion more satisfying",
        "📱 Set up stronger cues and reminders"
      ],
      low: [
        "💪 You're doing great! Small misses are normal",
        "🔍 Reflect on your identity - reinforce who you're becoming",
        "📊 Track your progress to see the compound growth",
        "🎉 Celebrate your consistency - you're building a lasting habit"
      ]
    };
    
    return suggestions[riskLevel];
  }

  // =====================================
  // UTILITY FUNCTIONS
  // =====================================

  private calculateCurrentStreak(logs: any[]): number {
    if (!logs || logs.length === 0) return 0;
    
    let streak = 0;
    const sortedLogs = logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (const log of sortedLogs) {
      if (log.status === 'done') {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // =====================================
  // PLATEAU DETECTION & BREAKTHROUGH
  // =====================================

  generateBreakthroughStrategies(habit: Habit, analysis: BehaviorAnalysis): string[] {
    const strategies = [
      `🎯 Increase difficulty: Add 10% more to your ${habit.title}`,
      `🔄 Change the method: Try a different approach to ${habit.title}`,
      `⏰ Switch timing: Move ${habit.title} to a different time of day`,
      `🌍 Change location: Do ${habit.title} in a new environment`,
      `👥 Add social element: Do ${habit.title} with others or share progress`,
      `📈 Track differently: Measure a new aspect of ${habit.title}`,
      `🎁 Change reward: Create a new celebration for completing ${habit.title}`,
      `🧠 Add mindfulness: Focus on the process, not just the outcome`
    ];
    
    return strategies.slice(0, 4); // Return top 4 strategies
  }
}

export const atomicHabitsService = AtomicHabitsService.getInstance();