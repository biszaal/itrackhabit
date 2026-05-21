/**
 * Habit Helper Utilities
 * Common utility functions for habit-related operations
 */

import { HABIT_TYPES } from "../../constants/app";

export const getDefaultHabitEmoji = (title: string): string => {
  const titleLower = (title || "").toLowerCase();

  // Exercise & Fitness
  if (titleLower.includes("exercise") || titleLower.includes("workout"))
    return "💪";
  if (titleLower.includes("run")) return "🏃";
  if (titleLower.includes("walk")) return "🚶";
  if (titleLower.includes("yoga")) return "🧘‍♀️";
  if (titleLower.includes("gym")) return "🏋️";

  // Learning & Reading
  if (titleLower.includes("read")) return "📖";
  if (titleLower.includes("study")) return "📚";
  if (titleLower.includes("learn")) return "🎓";
  if (titleLower.includes("write")) return "✍️";

  // Wellness & Health
  if (titleLower.includes("meditat")) return "🧘";
  if (titleLower.includes("water")) return "💧";
  if (titleLower.includes("sleep")) return "🛏️";
  if (titleLower.includes("vitamin")) return "💊";

  // Productivity
  if (titleLower.includes("work") || titleLower.includes("task")) return "💼";
  if (titleLower.includes("organize") || titleLower.includes("clean"))
    return "🗂️";

  // Social & Creative
  if (titleLower.includes("call") || titleLower.includes("friend")) return "📞";
  if (titleLower.includes("music") || titleLower.includes("play")) return "🎵";
  if (titleLower.includes("draw") || titleLower.includes("paint")) return "🎨";

  return "🎯"; // Default
};

export const getHabitTypeColor = (type: string): string => {
  switch (type) {
    case HABIT_TYPES.HEALTH:
      return "#FF6B6B";
    case HABIT_TYPES.PRODUCTIVITY:
      return "#4ECDC4";
    case HABIT_TYPES.LEARNING:
      return "#45B7D1";
    case HABIT_TYPES.WELLNESS:
      return "#96CEB4";
    case HABIT_TYPES.SOCIAL:
      return "#FECA57";
    case HABIT_TYPES.CREATIVE:
      return "#FF9FF3";
    default:
      return "#6366F1";
  }
};

export const calculateStreak = (
  progressHistory: Array<{ date: string; status: string }>
): number => {
  if (!progressHistory.length) return 0;

  const sortedHistory = progressHistory
    .filter((entry) => entry.status === "done")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!sortedHistory.length) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedHistory.length; i++) {
    const entryDate = new Date(sortedHistory[i].date);
    entryDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === streak) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};
