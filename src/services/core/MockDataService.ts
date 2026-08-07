// Demo data seeder — development builds only.
//
// Fills the *current* device profile with a few months of believable habit
// history so the app can be photographed for the App Store with something
// more representative than an empty state.
//
// This deliberately writes through the same shapes the app reads: progress
// rows use status 'done', targets live under `targetConfig`, and day keys use
// `toLocalISODate`. An earlier version of this file invented its own shapes
// under separate `mock_user_*` ids, so nothing it wrote was ever visible.

import { v4 as uuidv4 } from 'uuid';
import { offlineStorage } from './OfflineStorage';
import { Habit, HabitProgress, FrequencyType, HabitType } from '../../types';
import { toLocalISODate } from '../../utils/formatting/time';

interface SeedTemplate {
  title: string;
  notes: string;
  emoji: string;
  color: string;
  targetValue?: number;
  unit?: string;
  isTimeBased?: boolean;
  /** Rough share of days completed, 0–1. Drives how the history looks. */
  consistency: number;
  /** Days back from today this habit was started. */
  ageDays: number;
  /** Unbroken run ending today (or yesterday), for a believable streak. */
  currentRun: number;
  microSteps?: string[];
}

const DEMO_MARKER = 'demo_seed';

class MockDataService {
  // Enough habits to fill the list without overflowing a phone screenshot.
  private readonly templates: SeedTemplate[] = [
    {
      title: 'Morning meditation',
      notes: 'Ten quiet minutes before the day starts.',
      emoji: 'meditate',
      color: '#9B7BC7',
      targetValue: 10,
      unit: 'minutes',
      isTimeBased: true,
      consistency: 0.86,
      ageDays: 132,
      currentRun: 18,
      microSteps: ['Sit down', 'Set a timer', 'Breathe'],
    },
    {
      title: 'Morning run',
      notes: 'Easy pace, three times a week.',
      emoji: 'run',
      color: '#E07A77',
      targetValue: 30,
      unit: 'minutes',
      isTimeBased: true,
      consistency: 0.64,
      ageDays: 118,
      currentRun: 4,
    },
    {
      title: 'Read before bed',
      notes: 'Twenty pages, no screens.',
      emoji: 'read',
      color: '#6366F1',
      targetValue: 20,
      unit: 'pages',
      consistency: 0.78,
      ageDays: 96,
      currentRun: 11,
      microSteps: ['Phone on the shelf', 'Open the book'],
    },
    {
      title: 'Drink water',
      notes: 'Eight glasses through the day.',
      emoji: 'water',
      color: '#6FA8C7',
      targetValue: 8,
      unit: 'glasses',
      consistency: 0.9,
      ageDays: 132,
      currentRun: 26,
    },
    {
      title: 'Strength training',
      notes: 'Push, pull, legs.',
      emoji: 'strength',
      color: '#5A7A52',
      targetValue: 3,
      unit: 'sets',
      consistency: 0.58,
      ageDays: 74,
      currentRun: 2,
    },
    {
      title: 'Gratitude note',
      notes: 'Three things worth remembering.',
      emoji: 'gratitude',
      color: '#E0A864',
      targetValue: 3,
      unit: 'items',
      consistency: 0.71,
      ageDays: 61,
      currentRun: 7,
    },
  ];

  /**
   * Seed the current profile. Existing habits are left alone; this only adds.
   */
  async createMockData(userId: string): Promise<void> {
    await offlineStorage.initialize();

    const today = new Date();
    let habitCount = 0;
    let progressCount = 0;

    for (const [index, template] of this.templates.entries()) {
      const createdAt = this.daysBefore(today, template.ageDays);

      const habit: Habit = {
        id: uuidv4(),
        userId,
        title: template.title,
        notes: template.notes,
        frequency: 'daily' as FrequencyType,
        isShared: false,
        type: 'manual' as HabitType,
        color: template.color,
        emoji: template.emoji,
        targetConfig: {
          hasTarget: true,
          targetValue: template.targetValue ?? 1,
          unit: template.unit ?? 'times',
          isTimeBased: template.isTimeBased ?? false,
        },
        ...(template.microSteps
          ? {
              microSteps: template.microSteps.map((title) => ({
                id: uuidv4(),
                title,
              })),
            }
          : {}),
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(),
        pending: false,
      };

      await offlineStorage.saveHabit(habit);
      habitCount++;

      const rows = this.buildHistory(habit, template, today, index);
      for (const row of rows) {
        await offlineStorage.saveHabitProgress(row);
        progressCount++;
      }
    }

    await offlineStorage.setMetadata(DEMO_MARKER, 'true');
    console.log(`Seeded ${habitCount} habits and ${progressCount} progress rows`);
  }

  /**
   * Build a day-by-day history that produces a credible streak.
   *
   * The most recent `currentRun` days are always completed so the streak
   * counter reads well; everything before that is pseudo-random at the
   * template's consistency, with a deterministic seed so repeated runs and
   * screenshots stay identical.
   */
  private buildHistory(
    habit: Habit,
    template: SeedTemplate,
    today: Date,
    seedOffset: number
  ): HabitProgress[] {
    const rows: HabitProgress[] = [];
    const target = template.targetValue ?? 1;

    // Leave a couple of habits unfinished today so the daily ring sits at a
    // partial value — a full or empty ring photographs poorly.
    const doneToday = seedOffset % 3 !== 2;
    const runStart = doneToday ? 0 : 1;

    for (let back = 0; back < template.ageDays; back++) {
      const day = this.daysBefore(today, back);

      if (back === 0 && !doneToday) continue;

      const inCurrentRun = back >= runStart && back < runStart + template.currentRun;
      const completed = inCurrentRun
        ? true
        : this.pseudoRandom(seedOffset * 1000 + back) < template.consistency;

      if (!completed) continue;

      rows.push({
        id: uuidv4(),
        habitId: habit.id,
        date: toLocalISODate(day),
        status: 'done',
        currentValue: target,
        targetValue: target,
        unit: template.unit ?? 'times',
        updatedAt: day.toISOString(),
        pending: false,
      });
    }

    return rows;
  }

  /** Remove every habit this seeder created, along with its progress. */
  async removeMockData(userId: string): Promise<void> {
    await offlineStorage.initialize();

    const habits = await offlineStorage.getAllHabits(userId);
    const seeded = habits.filter((h) =>
      this.templates.some((t) => t.title === h.title)
    );

    for (const habit of seeded) {
      await offlineStorage.deleteHabit(habit.id);
    }

    await offlineStorage.setMetadata(DEMO_MARKER, 'false');
    console.log(`Removed ${seeded.length} seeded habits`);
  }

  async getMockDataStats(
    userId: string
  ): Promise<{ habits: number; progress: number; seeded: boolean }> {
    try {
      await offlineStorage.initialize();
      const habits = await offlineStorage.getHabits(userId);
      const progress = await offlineStorage.getAllHabitProgress(userId);
      const marker = await offlineStorage.getMetadata(DEMO_MARKER);

      return {
        habits: habits.length,
        progress: progress.length,
        seeded: marker === 'true',
      };
    } catch (error) {
      console.error('Failed to read demo data stats:', error);
      return { habits: 0, progress: 0, seeded: false };
    }
  }

  private daysBefore(from: Date, days: number): Date {
    return new Date(from.getFullYear(), from.getMonth(), from.getDate() - days);
  }

  /** Deterministic 0–1 noise, so the seeded history never shifts between runs. */
  private pseudoRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }
}

export const mockDataService = new MockDataService();
