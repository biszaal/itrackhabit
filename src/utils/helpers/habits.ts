/**
 * Habit Helper Utilities
 * Common utility functions for habit-related operations
 */

import { HABIT_TYPES } from "../../constants/app";
import { FrequencyType } from "../../types";
import { toLocalISODate } from '../formatting/time';

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

export interface ProgressEntry {
  date: string;
  status: string;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  isDoneToday: boolean;
  totalCompletions: number;
}

// Progress rows are keyed by *local* calendar day (`toLocalISODate`), so every
// day computation here must be local too. Doing this in UTC would shift the
// key by one for anyone west of UTC during their evening, silently breaking
// streaks at the exact moment people tend to check off habits.

// Local midnight for an instant. Returns null for anything unparseable —
// habit rows restored from older schema versions may lack timestamps.
const startOfLocalDay = (value: string | Date | null | undefined): Date | null => {
  if (value == null) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

// `new Date("2026-07-26")` parses as UTC midnight, which lands on the previous
// day west of UTC. Day keys must be read back as local dates.
const parseDayKey = (value: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

// Calendar-based rather than adding 86_400_000, so DST transitions (23- and
// 25-hour days) don't skip or repeat a day.
const addDays = (d: Date, n: number): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// A daily habit breaks its streak on a single missed day. Weekly and custom
// habits are only expected once per week, so a missed day must not reset them.
const periodLengthInDays = (frequency: FrequencyType): number =>
  frequency === "daily" ? 1 : 7;

/**
 * Derive streak and completion stats from a habit's progress log.
 *
 * The log only contains rows for days the user actually marked, so this walks
 * the calendar between the habit's creation and today rather than walking the
 * rows — a day with no row is a miss, and a miss breaks the streak.
 */
export const calculateHabitStats = (
  progress: ProgressEntry[],
  options: {
    createdAt: string;
    frequency: FrequencyType;
    today?: Date;
  }
): HabitStats => {
  const { createdAt, frequency } = options;

  const spanDays = periodLengthInDays(frequency);
  const todayStart = startOfLocalDay(options.today ?? new Date()) ?? new Date();
  const todayMs = todayStart.getTime();

  // Last status wins, so duplicate rows for one day can't double-count.
  const byDay = new Map<string, string>();
  let earliest: Date | null = null;
  for (const entry of progress) {
    if (!entry?.date) continue;
    const key = entry.date.slice(0, 10);
    byDay.set(key, entry.status);
    const entryStart = parseDayKey(key);
    if (entryStart && (!earliest || entryStart.getTime() < earliest.getTime())) {
      earliest = entryStart;
    }
  }

  // Anchor the walk at the habit's creation, or at its oldest progress row if
  // that predates it (imported or restored data), so no history is skipped.
  const createdStart = startOfLocalDay(createdAt);
  const candidates = [createdStart, earliest].filter(
    (d): d is Date => d != null && d.getTime() <= todayMs
  );
  const firstPeriodStart = candidates.length
    ? candidates.reduce((a, b) => (a.getTime() <= b.getTime() ? a : b))
    : todayStart;

  // A period counts as done if any day inside it was completed.
  const isPeriodDone = (periodStart: Date): boolean => {
    for (let offset = 0; offset < spanDays; offset++) {
      if (byDay.get(toLocalISODate(addDays(periodStart, offset))) === "done") {
        return true;
      }
    }
    return false;
  };

  const periods: boolean[] = [];
  for (
    let cursor = firstPeriodStart;
    cursor.getTime() <= todayMs;
    cursor = addDays(cursor, spanDays)
  ) {
    periods.push(isPeriodDone(cursor));
  }
  if (periods.length === 0) periods.push(isPeriodDone(todayStart));

  let longestStreak = 0;
  let run = 0;
  let donePeriods = 0;
  for (const done of periods) {
    run = done ? run + 1 : 0;
    if (done) donePeriods++;
    if (run > longestStreak) longestStreak = run;
  }

  let currentStreak = 0;
  for (let i = periods.length - 1; i >= 0; i--) {
    if (periods[i]) {
      currentStreak++;
    } else if (i === periods.length - 1) {
      // The current period is still in progress — not yet a broken streak.
      continue;
    } else {
      break;
    }
  }

  let totalCompletions = 0;
  for (const status of byDay.values()) {
    if (status === "done") totalCompletions++;
  }

  return {
    currentStreak,
    longestStreak,
    completionRate: Math.round((donePeriods / periods.length) * 100),
    isDoneToday: byDay.get(toLocalISODate(todayStart)) === "done",
    totalCompletions,
  };
};
