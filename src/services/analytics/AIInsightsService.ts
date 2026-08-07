import AsyncStorage from "@react-native-async-storage/async-storage";
import { dataService } from "../core/DataService";
import { achievementService } from "../premium/AchievementService";
import { Habit, HabitWithStats, HabitProgress } from "../../types";

export interface HabitRecommendation {
  id: string;
  type:
    | "new_habit"
    | "habit_improvement"
    | "time_optimization"
    | "streak_recovery";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  confidence: number; // 0-100
  suggestedAction: string;
  relatedHabits?: string[];
  estimatedImpact: string;
  category: string;
  emoji: string;
  createdAt: string;
}

export interface HabitInsight {
  id: string;
  type: "pattern" | "correlation" | "performance" | "timing" | "motivation";
  title: string;
  description: string;
  data: {
    metric: string;
    value: number | string;
    trend: "improving" | "declining" | "stable";
    comparison?: string;
  };
  actionable: boolean;
  relatedHabits: string[];
  createdAt: string;
}

export interface OptimalTiming {
  habitId: string;
  recommendedTimes: {
    hour: number;
    minute: number;
    confidence: number;
    reason: string;
  }[];
  avoidTimes: {
    hour: number;
    minute: number;
    reason: string;
  }[];
}

export interface PersonalizedCoaching {
  id: string;
  type: "motivation" | "strategy" | "reminder" | "celebration";
  title: string;
  message: string;
  habitId?: string;
  triggerCondition: string;
  isActive: boolean;
  createdAt: string;
}

export interface HabitCorrelation {
  habitA: string;
  habitB: string;
  habitATitle: string;
  habitBTitle: string;
  correlation: number; // -1 to 1
  strength: "weak" | "moderate" | "strong";
  type: "positive" | "negative";
  insight: string;
}

class AIInsightsService {
  private readonly STORAGE_KEY = "ai_insights_data";
  private readonly INSIGHTS_KEY = "habit_insights";
  private readonly RECOMMENDATIONS_KEY = "habit_recommendations";
  private readonly COACHING_KEY = "personalized_coaching";

  private recommendations: HabitRecommendation[] = [];
  private insights: HabitInsight[] = [];
  private coachingMessages: PersonalizedCoaching[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadAIData();
      this.isInitialized = true;
      console.log("✅ AIInsightsService initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize AIInsightsService:", error);
      throw error;
    }
  }

  // Smart Habit Recommendations
  async generateHabitRecommendations(): Promise<HabitRecommendation[]> {
    await this.initialize();
    await dataService.initialize();

    const habits = await dataService.getHabitsWithStats();
    const newRecommendations: HabitRecommendation[] = [];

    // Analyze user's current habits
    const categories = this.analyzeHabitCategories(habits);
    const completionRates = habits.map((h) => h.completionRate);
    const averageCompletionRate =
      completionRates.reduce((sum, rate) => sum + rate, 0) /
        completionRates.length || 0;

    // Recommend complementary habits
    newRecommendations.push(...this.generateComplementaryHabits(categories));

    // Recommend habit improvements
    newRecommendations.push(
      ...this.generateImprovementSuggestions(habits, averageCompletionRate)
    );

    // Recommend time optimization
    newRecommendations.push(...this.generateTimeOptimizations(habits));

    // Update stored recommendations
    this.recommendations = newRecommendations;
    await this.saveAIData();

    return newRecommendations;
  }

  private analyzeHabitCategories(
    habits: HabitWithStats[]
  ): Record<string, number> {
    const categories: Record<string, number> = {};
    habits.forEach((habit) => {
      const category = habit.type || "general";
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }

  private generateComplementaryHabits(
    categories: Record<string, number>
  ): HabitRecommendation[] {
    const recommendations: HabitRecommendation[] = [];
    const totalHabits = Object.values(categories).reduce(
      (sum, count) => sum + count,
      0
    );

    // Suggest missing essential categories
    const essentialCategories = [
      {
        type: "health",
        title: "Morning Exercise",
        description: "Start your day with 20 minutes of physical activity",
        emoji: "strength",
      },
      {
        type: "mindfulness",
        title: "Daily Meditation",
        description: "Practice 10 minutes of mindfulness meditation",
        emoji: "meditate",
      },
      {
        type: "learning",
        title: "Read for Growth",
        description: "Read 15 pages of a personal development book daily",
        emoji: "study",
      },
      {
        type: "productivity",
        title: "Plan Tomorrow",
        description: "Spend 5 minutes planning the next day before bed",
        emoji: "journal",
      },
    ];

    essentialCategories.forEach((category) => {
      if (!categories[category.type] || categories[category.type] === 0) {
        recommendations.push({
          id: `rec_${category.type}_${Date.now()}`,
          type: "new_habit",
          title: category.title,
          description: category.description,
          priority: "high",
          confidence: 85,
          suggestedAction: `Add "${category.title}" to your daily routine`,
          estimatedImpact:
            "High - This habit complements your existing routine perfectly",
          category: category.type,
          emoji: category.emoji,
          createdAt: new Date().toISOString(),
        });
      }
    });

    return recommendations;
  }

  private generateImprovementSuggestions(
    habits: HabitWithStats[],
    averageRate: number
  ): HabitRecommendation[] {
    const recommendations: HabitRecommendation[] = [];

    // Find habits with low completion rates
    const strugglingHabits = habits.filter(
      (h) => h.completionRate < averageRate - 20 && h.completionRate < 70
    );

    strugglingHabits.forEach((habit) => {
      recommendations.push({
        id: `improve_${habit.id}_${Date.now()}`,
        type: "habit_improvement",
        title: `Improve "${habit.title}" Success Rate`,
        description: `Your completion rate for this habit is ${Math.round(
          habit.completionRate
        )}%. Let's optimize it!`,
        priority: habit.completionRate < 30 ? "high" : "medium",
        confidence: 78,
        suggestedAction: this.getSuggestionForLowPerformance(habit),
        relatedHabits: [habit.id],
        estimatedImpact: `Could increase success rate by 25-40%`,
        category: habit.type || "general",
        emoji: "analytics",
        createdAt: new Date().toISOString(),
      });
    });

    return recommendations;
  }

  private generateTimeOptimizations(
    habits: HabitWithStats[]
  ): HabitRecommendation[] {
    const recommendations: HabitRecommendation[] = [];

    // Find habits that could be grouped together
    const similarHabits = this.findSimilarHabits(habits);

    if (similarHabits.length > 1) {
      recommendations.push({
        id: `stack_${Date.now()}`,
        type: "time_optimization",
        title: "Create a Habit Stack",
        description: `Group similar habits together for better consistency`,
        priority: "medium",
        confidence: 72,
        suggestedAction: `Try doing ${similarHabits
          .map((h) => h.title)
          .join(", ")} in sequence`,
        relatedHabits: similarHabits.map((h) => h.id),
        estimatedImpact:
          "Medium - Habit stacking can improve consistency by 30%",
        category: "productivity",
        emoji: "link",
        createdAt: new Date().toISOString(),
      });
    }

    return recommendations;
  }

  private getSuggestionForLowPerformance(habit: HabitWithStats): string {
    if (habit.completionRate < 30) {
      return `Consider reducing the target or frequency. Start smaller and build momentum.`;
    } else if (habit.completionRate < 50) {
      return `Try setting a specific time and location for this habit. Consistency is key.`;
    } else {
      return `Add a reward system or find an accountability partner for this habit.`;
    }
  }

  private findSimilarHabits(habits: HabitWithStats[]): HabitWithStats[] {
    // Simple heuristic: habits in the same category or with similar names
    const categories = this.analyzeHabitCategories(habits);
    const largestCategory = Object.keys(categories).reduce((a, b) =>
      categories[a] > categories[b] ? a : b
    );

    return habits
      .filter((h) => (h.type || "general") === largestCategory)
      .slice(0, 3);
  }

  // Pattern Recognition
  async analyzeHabitPatterns(): Promise<HabitInsight[]> {
    await this.initialize();
    await dataService.initialize();

    const habits = await dataService.getHabitsWithStats();
    const newInsights: HabitInsight[] = [];

    // Analyze completion patterns
    newInsights.push(...(await this.analyzeCompletionPatterns(habits)));

    // Analyze timing patterns
    newInsights.push(...(await this.analyzeTimingPatterns(habits)));

    // Analyze performance trends
    newInsights.push(...(await this.analyzePerformanceTrends(habits)));

    this.insights = newInsights;
    await this.saveAIData();

    return newInsights;
  }

  private async analyzeCompletionPatterns(
    habits: HabitWithStats[]
  ): Promise<HabitInsight[]> {
    const insights: HabitInsight[] = [];

    for (const habit of habits) {
      // Analyze weekly patterns
      const progress = await dataService.getHabitProgress(habit.id);
      const weeklyCompletion = this.getWeeklyCompletionRate(progress);

      if (weeklyCompletion.weekends < weeklyCompletion.weekdays - 30) {
        insights.push({
          id: `pattern_weekend_${habit.id}`,
          type: "pattern",
          title: "Weekend Challenge Detected",
          description: `You're ${Math.round(
            weeklyCompletion.weekdays - weeklyCompletion.weekends
          )}% less likely to complete "${habit.title}" on weekends`,
          data: {
            metric: "Weekend vs Weekday completion",
            value: `${Math.round(weeklyCompletion.weekends)}% vs ${Math.round(
              weeklyCompletion.weekdays
            )}%`,
            trend: "declining",
            comparison: "weekdays",
          },
          actionable: true,
          relatedHabits: [habit.id],
          createdAt: new Date().toISOString(),
        });
      }

      // Analyze streak patterns
      if (
        habit.longestStreak > habit.currentStreak * 2 &&
        habit.currentStreak < 7
      ) {
        insights.push({
          id: `pattern_streak_${habit.id}`,
          type: "performance",
          title: "Streak Recovery Opportunity",
          description: `Your longest streak for "${habit.title}" was ${habit.longestStreak} days. You can get back there!`,
          data: {
            metric: "Current vs Longest Streak",
            value: `${habit.currentStreak} vs ${habit.longestStreak} days`,
            trend: "declining",
          },
          actionable: true,
          relatedHabits: [habit.id],
          createdAt: new Date().toISOString(),
        });
      }
    }

    return insights;
  }

  private getWeeklyCompletionRate(progress: HabitProgress[]): {
    weekdays: number;
    weekends: number;
  } {
    const weekdayCompletions = progress.filter((p) => {
      const day = new Date(p.date).getDay();
      return day >= 1 && day <= 5 && p.status === "done";
    }).length;

    const weekendCompletions = progress.filter((p) => {
      const day = new Date(p.date).getDay();
      return (day === 0 || day === 6) && p.status === "done";
    }).length;

    const totalWeekdays = progress.filter((p) => {
      const day = new Date(p.date).getDay();
      return day >= 1 && day <= 5;
    }).length;

    const totalWeekends = progress.filter((p) => {
      const day = new Date(p.date).getDay();
      return day === 0 || day === 6;
    }).length;

    return {
      weekdays:
        totalWeekdays > 0 ? (weekdayCompletions / totalWeekdays) * 100 : 0,
      weekends:
        totalWeekends > 0 ? (weekendCompletions / totalWeekends) * 100 : 0,
    };
  }

  private async analyzeTimingPatterns(
    habits: HabitWithStats[]
  ): Promise<HabitInsight[]> {
    const insights: HabitInsight[] = [];

    // Mock timing analysis (in a real app, this would analyze actual completion times)
    const highPerformingHabits = habits.filter((h) => h.completionRate > 80);
    const morningHabits = highPerformingHabits.filter(
      (h) =>
        (h.title || "").toLowerCase().includes("morning") ||
        (h.title || "").toLowerCase().includes("exercise")
    );

    if (morningHabits.length > 0) {
      insights.push({
        id: `timing_morning_${Date.now()}`,
        type: "timing",
        title: "Morning Momentum Pattern",
        description: `You're ${Math.round(
          (morningHabits.length / highPerformingHabits.length) * 100
        )}% more successful with morning habits`,
        data: {
          metric: "Morning habit success rate",
          value: `${Math.round(
            morningHabits.reduce((sum, h) => sum + h.completionRate, 0) /
              morningHabits.length
          )}%`,
          trend: "stable",
        },
        actionable: true,
        relatedHabits: morningHabits.map((h) => h.id),
        createdAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  private async analyzePerformanceTrends(
    habits: HabitWithStats[]
  ): Promise<HabitInsight[]> {
    const insights: HabitInsight[] = [];

    // Overall performance insight
    const averageCompletion =
      habits.reduce((sum, h) => sum + h.completionRate, 0) / habits.length || 0;
    const strongHabits = habits.filter((h) => h.completionRate > 80).length;

    if (averageCompletion > 70) {
      insights.push({
        id: `performance_overall_${Date.now()}`,
        type: "performance",
        title: "Strong Habit Formation",
        description: `You're maintaining ${Math.round(
          averageCompletion
        )}% completion rate across ${
          habits.length
        } habits - excellent consistency!`,
        data: {
          metric: "Overall completion rate",
          value: `${Math.round(averageCompletion)}%`,
          trend: "improving",
        },
        actionable: false,
        relatedHabits: habits.map((h) => h.id),
        createdAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  // Optimal Timing Suggestions
  async getOptimalTiming(habitId: string): Promise<OptimalTiming> {
    // Mock optimal timing analysis (in a real app, this would analyze user's historical data)
    const habits = await dataService.getHabits();
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) {
      throw new Error("Habit not found");
    }

    // Simple heuristic based on habit type
    const recommendations = this.getTimeRecommendationsByType(
      habit.type || "general"
    );

    return {
      habitId,
      recommendedTimes: recommendations.optimal,
      avoidTimes: recommendations.avoid,
    };
  }

  private getTimeRecommendationsByType(type: string): {
    optimal: {
      hour: number;
      minute: number;
      confidence: number;
      reason: string;
    }[];
    avoid: { hour: number; minute: number; reason: string }[];
  } {
    const recommendations: Record<string, any> = {
      health: {
        optimal: [
          {
            hour: 7,
            minute: 0,
            confidence: 90,
            reason: "Morning energy levels are highest",
          },
          {
            hour: 18,
            minute: 0,
            confidence: 75,
            reason: "Post-work stress relief",
          },
        ],
        avoid: [
          { hour: 22, minute: 0, reason: "Too close to bedtime" },
          { hour: 13, minute: 0, reason: "Post-lunch energy dip" },
        ],
      },
      mindfulness: {
        optimal: [
          { hour: 6, minute: 30, confidence: 95, reason: "Quiet morning mind" },
          { hour: 21, minute: 0, confidence: 80, reason: "Evening wind-down" },
        ],
        avoid: [
          { hour: 12, minute: 0, reason: "Midday distractions" },
          { hour: 17, minute: 0, reason: "Rush hour stress" },
        ],
      },
      productivity: {
        optimal: [
          {
            hour: 9,
            minute: 0,
            confidence: 85,
            reason: "Peak cognitive performance",
          },
          {
            hour: 14,
            minute: 30,
            confidence: 70,
            reason: "Afternoon focus window",
          },
        ],
        avoid: [
          { hour: 16, minute: 0, reason: "Energy crash time" },
          { hour: 20, minute: 0, reason: "Evening fatigue" },
        ],
      },
    };

    return (
      recommendations[type] || {
        optimal: [
          {
            hour: 8,
            minute: 0,
            confidence: 70,
            reason: "Morning routine integration",
          },
          {
            hour: 19,
            minute: 0,
            confidence: 65,
            reason: "Evening routine integration",
          },
        ],
        avoid: [{ hour: 23, minute: 0, reason: "Too late in the day" }],
      }
    );
  }

  // Personalized Coaching
  async generatePersonalizedCoaching(): Promise<PersonalizedCoaching[]> {
    await this.initialize();
    await dataService.initialize();

    const habits = await dataService.getHabitsWithStats();
    const achievements = achievementService.getUserAchievements();
    const newCoaching: PersonalizedCoaching[] = [];

    // Motivational messages for struggling habits
    const strugglingHabits = habits.filter((h) => h.completionRate < 50);
    strugglingHabits.forEach((habit) => {
      newCoaching.push({
        id: `coaching_motivation_${habit.id}`,
        type: "motivation",
        title: "Keep Going!",
        message: this.getMotivationalMessage(habit),
        habitId: habit.id,
        triggerCondition: "low_completion_rate",
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    });

    // Celebration messages for successful habits
    const successfulHabits = habits.filter((h) => h.currentStreak >= 7);
    successfulHabits.forEach((habit) => {
      newCoaching.push({
        id: `coaching_celebration_${habit.id}`,
        type: "celebration",
        title: "Amazing Streak!",
        message: `You've maintained "${habit.title}" for ${habit.currentStreak} days straight! This is the power of consistency in action.`,
        habitId: habit.id,
        triggerCondition: "streak_milestone",
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    });

    // Strategic advice
    if (habits.length >= 3) {
      newCoaching.push({
        id: `coaching_strategy_${Date.now()}`,
        type: "strategy",
        title: "Habit Stacking Tip",
        message:
          "Try linking your habits together! After you finish one habit, immediately start the next. This creates powerful behavioral chains.",
        triggerCondition: "multiple_habits",
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    }

    this.coachingMessages = newCoaching;
    await this.saveAIData();

    return newCoaching;
  }

  private getMotivationalMessage(habit: HabitWithStats): string {
    const messages = [
      `Remember why you started "${habit.title}" - that motivation is still valid!`,
      `Every small step with "${habit.title}" is progress. You're building something amazing!`,
      `"${habit.title}" might be challenging now, but consistency beats perfection every time!`,
      `Your future self will thank you for not giving up on "${habit.title}" today!`,
      `Progress, not perfection! Keep working on "${habit.title}" - you've got this! ⭐`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Habit Correlation Analysis
  async analyzeHabitCorrelations(): Promise<HabitCorrelation[]> {
    await this.initialize();
    await dataService.initialize();

    const habits = await dataService.getHabitsWithStats();
    const correlations: HabitCorrelation[] = [];

    // Simple correlation analysis (in a real app, this would use statistical correlation)
    for (let i = 0; i < habits.length - 1; i++) {
      for (let j = i + 1; j < habits.length; j++) {
        const habitA = habits[i];
        const habitB = habits[j];

        // Mock correlation based on categories and completion rates
        const correlation = this.calculateMockCorrelation(habitA, habitB);

        if (Math.abs(correlation) > 0.3) {
          correlations.push({
            habitA: habitA.id,
            habitB: habitB.id,
            habitATitle: habitA.title,
            habitBTitle: habitB.title,
            correlation,
            strength:
              Math.abs(correlation) > 0.7
                ? "strong"
                : Math.abs(correlation) > 0.5
                ? "moderate"
                : "weak",
            type: correlation > 0 ? "positive" : "negative",
            insight: this.generateCorrelationInsight(
              habitA,
              habitB,
              correlation
            ),
          });
        }
      }
    }

    return correlations.slice(0, 5); // Return top 5 correlations
  }

  private calculateMockCorrelation(
    habitA: HabitWithStats,
    habitB: HabitWithStats
  ): number {
    // Simple heuristic: similar categories and completion rates suggest positive correlation
    const categoryMatch = habitA.type === habitB.type ? 0.4 : 0;
    const completionSimilarity =
      1 - Math.abs(habitA.completionRate - habitB.completionRate) / 100;
    return (
      Math.min(0.9, categoryMatch + completionSimilarity * 0.6) *
      (Math.random() > 0.5 ? 1 : -1)
    );
  }

  private generateCorrelationInsight(
    habitA: HabitWithStats,
    habitB: HabitWithStats,
    correlation: number
  ): string {
    if (correlation > 0) {
      return `When you succeed with "${habitA.title}", you're also more likely to complete "${habitB.title}". Consider doing them together!`;
    } else {
      return `There seems to be a trade-off between "${habitA.title}" and "${habitB.title}". Focus on one when the other is challenging.`;
    }
  }

  // Data persistence
  private async loadAIData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const aiData = JSON.parse(data);
        this.recommendations = aiData.recommendations || [];
        this.insights = aiData.insights || [];
        this.coachingMessages = aiData.coaching || [];
      }
    } catch (error) {
      console.error("Failed to load AI insights data:", error);
    }
  }

  private async saveAIData(): Promise<void> {
    try {
      const aiData = {
        recommendations: this.recommendations,
        insights: this.insights,
        coaching: this.coachingMessages,
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(aiData));
    } catch (error) {
      console.error("Failed to save AI insights data:", error);
    }
  }

  // Public getters
  async getRecommendations(): Promise<HabitRecommendation[]> {
    await this.initialize();
    return this.recommendations;
  }

  async getInsights(): Promise<HabitInsight[]> {
    await this.initialize();
    return this.insights;
  }

  async getCoachingMessages(): Promise<PersonalizedCoaching[]> {
    await this.initialize();
    return this.coachingMessages.filter((msg) => msg.isActive);
  }

  // Refresh insights
  async refreshInsights(): Promise<void> {
    await this.generateHabitRecommendations();
    await this.analyzeHabitPatterns();
    await this.generatePersonalizedCoaching();
  }
}

export const aiInsightsService = new AIInsightsService();
