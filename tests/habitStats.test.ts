import { calculateHabitStats } from '../src/utils/helpers/habits';
import { toLocalISODate } from '../src/utils/formatting/time';

// Progress rows are keyed by local calendar day, so these helpers build local
// dates too — otherwise the expectations would shift with the machine's TZ.
const TODAY = new Date(2026, 6, 26, 12, 0, 0);
const daysAgo = (n: number) => new Date(2026, 6, 26 - n, 12, 0, 0);
const ago = (n: number) => toLocalISODate(daysAgo(n));
const createdDaysAgo = (n: number) => daysAgo(n).toISOString();

describe('calculateHabitStats', () => {
  it('treats a day with no record as a break', () => {
    // done today, done yesterday, NOTHING two days ago, done three days ago
    const stats = calculateHabitStats(
      [
        { date: ago(0), status: 'done' },
        { date: ago(1), status: 'done' },
        { date: ago(3), status: 'done' },
      ],
      { createdAt: createdDaysAgo(3), frequency: 'daily', today: TODAY }
    );

    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBe(2);
    expect(stats.totalCompletions).toBe(3);
    expect(stats.isDoneToday).toBe(true);
    // 3 completed days out of the 4 the habit has existed
    expect(stats.completionRate).toBe(75);
  });

  it('resets a stale streak once the user stops', () => {
    const stats = calculateHabitStats(
      [{ date: ago(2), status: 'done' }],
      { createdAt: createdDaysAgo(5), frequency: 'daily', today: TODAY }
    );

    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(1);
  });

  it('keeps the streak alive when today has not been marked yet', () => {
    const stats = calculateHabitStats(
      [
        { date: ago(1), status: 'done' },
        { date: ago(2), status: 'done' },
      ],
      { createdAt: createdDaysAgo(2), frequency: 'daily', today: TODAY }
    );

    expect(stats.currentStreak).toBe(2);
    expect(stats.isDoneToday).toBe(false);
  });

  it('counts an explicit skip as a break', () => {
    const stats = calculateHabitStats(
      [
        { date: ago(0), status: 'done' },
        { date: ago(1), status: 'skip' },
        { date: ago(2), status: 'done' },
      ],
      { createdAt: createdDaysAgo(2), frequency: 'daily', today: TODAY }
    );

    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(1);
  });

  it('does not reset a weekly habit after a single missed day', () => {
    const stats = calculateHabitStats(
      [
        { date: ago(1), status: 'done' },
        { date: ago(9), status: 'done' },
        { date: ago(16), status: 'done' },
      ],
      { createdAt: createdDaysAgo(20), frequency: 'weekly', today: TODAY }
    );

    expect(stats.currentStreak).toBeGreaterThanOrEqual(2);
    expect(stats.longestStreak).toBeGreaterThanOrEqual(2);
  });

  it('handles an empty progress log', () => {
    const stats = calculateHabitStats([], {
      createdAt: createdDaysAgo(0),
      frequency: 'daily',
      today: TODAY,
    });

    expect(stats).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      isDoneToday: false,
      totalCompletions: 0,
    });
  });

  it('counts history that predates the habit createdAt', () => {
    // Restored/imported rows older than the habit record itself
    const stats = calculateHabitStats(
      [
        { date: ago(0), status: 'done' },
        { date: ago(1), status: 'done' },
        { date: ago(2), status: 'done' },
      ],
      { createdAt: createdDaysAgo(1), frequency: 'daily', today: TODAY }
    );

    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
  });

  it('survives a missing or malformed createdAt', () => {
    const stats = calculateHabitStats(
      [{ date: ago(0), status: 'done' }],
      { createdAt: undefined as any, frequency: 'daily', today: TODAY }
    );

    expect(stats.currentStreak).toBe(1);
    expect(stats.isDoneToday).toBe(true);
  });

  it('reads back a habit marked late in the evening west of UTC', () => {
    // 8pm local on the 26th is already the 27th in UTC. Doing this math in UTC
    // looks up the wrong key and reports the streak as broken.
    const evening = new Date(2026, 6, 26, 20, 0, 0);
    const stats = calculateHabitStats(
      [
        { date: toLocalISODate(evening), status: 'done' },
        { date: toLocalISODate(new Date(2026, 6, 25)), status: 'done' },
      ],
      {
        createdAt: new Date(2026, 6, 25).toISOString(),
        frequency: 'daily',
        today: evening,
      }
    );

    expect(stats.isDoneToday).toBe(true);
    expect(stats.currentStreak).toBe(2);
  });

  it('does not skip or repeat a day across a DST transition', () => {
    // US DST ends Nov 1 2026 — that local day is 25 hours long.
    const done = [4, 3, 2, 1, 0].map((n) => ({
      date: toLocalISODate(new Date(2026, 10, 2 - n)),
      status: 'done',
    }));

    const stats = calculateHabitStats(done, {
      createdAt: new Date(2026, 9, 29).toISOString(),
      frequency: 'daily',
      today: new Date(2026, 10, 2, 12, 0, 0),
    });

    expect(stats.currentStreak).toBe(5);
    expect(stats.longestStreak).toBe(5);
  });

  it('ignores duplicate rows for the same day', () => {
    const stats = calculateHabitStats(
      [
        { date: ago(0), status: 'done' },
        { date: ago(0), status: 'done' },
      ],
      { createdAt: createdDaysAgo(0), frequency: 'daily', today: TODAY }
    );

    expect(stats.totalCompletions).toBe(1);
    expect(stats.completionRate).toBe(100);
  });
});
