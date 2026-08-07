/**
 * Micro-steps, plus the icon field they travel with.
 *
 * Both were being dropped between the UI and SQLite: `createHabit` never
 * copied them onto the new habit, and `ensureHabitFields` rebuilt the record
 * without them. The UI wrote `emoji` on every save and it silently vanished.
 */

const habitStore: any[] = [];
const progressStore: any[] = [];

jest.mock('../src/services/auth', () => ({
  authService: {
    getCurrentUser: jest.fn().mockResolvedValue(null),
    isAuthenticated: jest.fn().mockReturnValue(false),
    addAuthListener: jest.fn().mockReturnValue(() => {}),
  },
}));

jest.mock('../src/services/core/OfflineStorage', () => ({
  offlineStorage: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getHabits: jest.fn(async () => [...habitStore]),
    getAllHabits: jest.fn(async () => [...habitStore]),
    saveHabit: jest.fn(async (h: any) => {
      habitStore.push(h);
    }),
    getHabitById: jest.fn(async (id: string) => habitStore.find((h) => h.id === id) ?? null),
    updateHabit: jest.fn(async (h: any) => {
      const i = habitStore.findIndex((x) => x.id === h.id);
      if (i >= 0) habitStore[i] = h;
    }),
    deleteHabit: jest.fn().mockResolvedValue(undefined),
    getMetadata: jest.fn().mockResolvedValue('true'),
    setMetadata: jest.fn().mockResolvedValue(undefined),
    getHabitProgressForDate: jest.fn(
      async (habitId: string, date: string) =>
        progressStore.find((p) => p.habitId === habitId && p.date === date) ?? null
    ),
    saveHabitProgress: jest.fn(async (p: any) => {
      progressStore.push(p);
    }),
    updateHabitProgress: jest.fn(async (p: any) => {
      const i = progressStore.findIndex((x) => x.id === p.id);
      if (i >= 0) progressStore[i] = p;
    }),
    getHabitProgress: jest.fn(async () => [...progressStore]),
  },
}));

jest.mock('../src/services/core/NetworkService', () => ({
  networkService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getConnectionStatus: jest.fn().mockReturnValue(false),
    addNetworkListener: jest.fn().mockReturnValue(() => {}),
    addSyncCallback: jest.fn().mockReturnValue(() => {}),
  },
}));

jest.mock('../src/services/core/SupabaseService', () => ({
  supabaseService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    isConfigured: jest.fn().mockReturnValue(false),
  },
}));

jest.mock('../src/services/habits', () => ({
  habitsService: {
    getUserHabits: jest.fn().mockResolvedValue([]),
    createHabit: jest.fn().mockRejectedValue(new Error('offline')),
  },
}));

import { dataService } from '../src/services/core/DataService';

describe('micro-steps and icon persistence', () => {
  beforeEach(() => {
    habitStore.length = 0;
    progressStore.length = 0;
  });

  const steps = [
    { id: 's1', title: 'Put shoes on' },
    { id: 's2', title: 'Walk to the door' },
  ];

  it('keeps microSteps and the icon when creating a habit', async () => {
    await dataService.createHabit({
      title: 'Morning run',
      emoji: 'run',
      microSteps: steps,
    } as any);

    const saved = habitStore.find((h) => h.title === 'Morning run');
    expect(saved).toBeDefined();
    expect(saved.emoji).toBe('run');
    expect(saved.microSteps).toEqual(steps);
  });

  it('keeps them through an update', async () => {
    await dataService.createHabit({ title: 'Read', emoji: 'read' } as any);
    const created = habitStore.find((h) => h.title === 'Read');

    const updated = await dataService.updateHabit(created.id, { microSteps: steps });

    expect(updated.microSteps).toEqual(steps);
    expect(updated.emoji).toBe('read'); // untouched fields survive
  });

  it('records which steps were ticked on a given day', async () => {
    const p = await dataService.markHabitProgress('h1', '2026-01-15', 'partial', {
      microStepsDone: ['s1'],
    });
    expect(p.microStepsDone).toEqual(['s1']);
  });

  it('does not erase fields the caller never mentioned', async () => {
    await dataService.markHabitProgress('h1', '2026-01-15', 'partial', {
      microStepsDone: ['s1', 's2'],
      notes: 'felt good',
      currentValue: 12,
    });

    // The habit-list toggle calls this with no options at all.
    const after = await dataService.markHabitProgress('h1', '2026-01-15', 'done');

    expect(after.microStepsDone).toEqual(['s1', 's2']);
    expect(after.notes).toBe('felt good');
    expect(after.currentValue).toBe(12);
    expect(after.status).toBe('done');
  });
});
