import { toLocalISODate } from '../src/utils/formatting/time';

/**
 * Regression cover for the timezone bug these helpers replaced.
 *
 * `date.toISOString().split('T')[0]` serialises via UTC, so a date built from
 * local calendar parts lands on the previous day for any user east of UTC.
 * That filed habit progress under the wrong day for a large share of users.
 */
describe('toLocalISODate', () => {
  const withTZ = (tz: string, fn: () => void) => {
    const original = process.env.TZ;
    process.env.TZ = tz;
    try {
      fn();
    } finally {
      process.env.TZ = original;
    }
  };

  it('formats a date from its local calendar parts', () => {
    expect(toLocalISODate(new Date(2026, 0, 15))).toBe('2026-01-15');
  });

  it('zero-pads single-digit months and days', () => {
    expect(toLocalISODate(new Date(2026, 8, 5))).toBe('2026-09-05');
    expect(toLocalISODate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('never disagrees with the local calendar day', () => {
    // Whatever the host timezone, the output must match what getDate() says.
    const samples = [
      new Date(2026, 0, 1),
      new Date(2026, 0, 15, 0, 0, 0),
      new Date(2026, 5, 30, 23, 59, 59),
      new Date(2026, 11, 31, 9, 0, 0),
    ];
    for (const d of samples) {
      const [y, m, day] = toLocalISODate(d).split('-').map(Number);
      expect(y).toBe(d.getFullYear());
      expect(m).toBe(d.getMonth() + 1);
      expect(day).toBe(d.getDate());
    }
  });

  it('does not drift to the previous day the way toISOString did', () => {
    withTZ('Australia/Sydney', () => {
      const d = new Date(2026, 0, 15, 9, 0, 0);
      // The old expression produced the 14th here for UTC+11.
      expect(toLocalISODate(d)).toBe('2026-01-15');
      expect(toLocalISODate(d)).toBe(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`
      );
    });
  });

  it('defaults to today', () => {
    const now = new Date();
    expect(toLocalISODate()).toBe(toLocalISODate(now));
  });
});
