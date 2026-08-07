/**
 * Regression cover for duplicated default habits.
 *
 * `initialize()` sets `isInitialized` only after a long await chain. With 22
 * call sites across the app, several callers reach it during startup; before
 * the in-flight guard, each ran the full sequence, and `ensureDefaultHabits()`
 * seeded "Exercise 30 min" + "Meditate 30 min" once per run — producing the
 * doubled list users actually saw.
 */

const habitStore: any[] = [];
const metadataStore: Record<string, string> = {};

// Model the real async storage: an await between read and write is exactly
// the window the racing initializers used to slip through.
const tick = () => new Promise((r) => setTimeout(r, 0));

jest.mock("../src/services/auth", () => ({
  authService: {
    getCurrentUser: jest.fn().mockResolvedValue(null),
    isAuthenticated: jest.fn().mockReturnValue(false),
    addAuthListener: jest.fn().mockReturnValue(() => {}),
  },
}));

jest.mock("../src/services/core/OfflineStorage", () => ({
  offlineStorage: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getHabits: jest.fn(async () => {
      await tick();
      return [...habitStore];
    }),
    saveHabit: jest.fn(async (h: any) => {
      await tick();
      habitStore.push(h);
    }),
    deleteHabit: jest.fn(async (id: string) => {
      await tick();
      const i = habitStore.findIndex((h) => h.id === id);
      if (i >= 0) habitStore.splice(i, 1);
    }),
    getMetadata: jest.fn(async (k: string) => {
      await tick();
      return metadataStore[k] ?? null;
    }),
    setMetadata: jest.fn(async (k: string, v: string) => {
      await tick();
      metadataStore[k] = v;
    }),
    getAllHabits: jest.fn(async () => [...habitStore]),
    updateHabit: jest.fn().mockResolvedValue(undefined),
    getHabitProgress: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("../src/services/core/NetworkService", () => ({
  networkService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getConnectionStatus: jest.fn().mockReturnValue(false),
    addNetworkListener: jest.fn().mockReturnValue(() => {}),
    addSyncCallback: jest.fn().mockReturnValue(() => {}),
  },
}));

jest.mock("../src/services/core/SupabaseService", () => ({
  supabaseService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    isConfigured: jest.fn().mockReturnValue(false),
  },
}));

jest.mock("../src/services/habits", () => ({
  habitsService: {
    getUserHabits: jest.fn().mockResolvedValue([]),
    syncPendingHabits: jest.fn().mockResolvedValue({ synced: 0 }),
    syncPendingProgress: jest.fn().mockResolvedValue({ synced: 0 }),
  },
}));

describe("DataService default-habit seeding", () => {
  beforeEach(() => {
    habitStore.length = 0;
    for (const k of Object.keys(metadataStore)) delete metadataStore[k];
    jest.resetModules();
  });

  const titlesOf = () => habitStore.map((h) => h.title).sort();

  it("seeds each default habit exactly once on a single init", async () => {
    const { dataService } = require("../src/services/core/DataService");
    await dataService.initialize();

    expect(titlesOf()).toEqual(["Exercise 30 min", "Meditate 30 min"]);
  });

  it("does not duplicate when many callers race initialize()", async () => {
    const { dataService } = require("../src/services/core/DataService");

    // All 8 arrive before the first run finishes — the real startup pattern.
    await Promise.all(Array.from({ length: 8 }, () => dataService.initialize()));

    expect(titlesOf()).toEqual(["Exercise 30 min", "Meditate 30 min"]);
    expect(habitStore).toHaveLength(2);
  });

  it("does not re-seed on a later initialize()", async () => {
    const { dataService } = require("../src/services/core/DataService");

    await dataService.initialize();
    await dataService.initialize();

    expect(habitStore).toHaveLength(2);
  });

  it("does not seed a title that already exists", async () => {
    habitStore.push({
      id: "existing",
      title: "Exercise 30 min",
      color: "#A8B5A0",
      createdAt: new Date().toISOString(),
    });

    const { dataService } = require("../src/services/core/DataService");
    await dataService.initialize();

    // Pre-existing habits mean the seeder should stand down entirely.
    expect(habitStore.filter((h) => h.title === "Exercise 30 min")).toHaveLength(
      1
    );
  });

  it("collapses duplicates left behind by the old race", async () => {
    const older = new Date(Date.now() - 60_000).toISOString();
    const newer = new Date().toISOString();
    habitStore.push(
      { id: "keep-1", title: "Exercise 30 min", color: "#A8B5A0", createdAt: older },
      { id: "dupe-1", title: "Exercise 30 min", color: "#A8B5A0", createdAt: newer },
      { id: "keep-2", title: "Meditate 30 min", color: "#A8B5A0", createdAt: older },
      { id: "dupe-2", title: "Meditate 30 min", color: "#A8B5A0", createdAt: newer }
    );

    const { dataService } = require("../src/services/core/DataService");
    await dataService.initialize();

    expect(habitStore).toHaveLength(2);
    // The oldest of each pair survives, so streak history stays attached.
    expect(habitStore.map((h) => h.id).sort()).toEqual(["keep-1", "keep-2"]);
  });

  it("leaves user-created same-title habits alone", async () => {
    const older = new Date(Date.now() - 60_000).toISOString();
    const newer = new Date().toISOString();
    habitStore.push(
      // Not the seed color => hand-made, must never be auto-deleted.
      { id: "mine-1", title: "Exercise 30 min", color: "#FF0000", createdAt: older },
      { id: "mine-2", title: "Exercise 30 min", color: "#FF0000", createdAt: newer }
    );

    const { dataService } = require("../src/services/core/DataService");
    await dataService.initialize();

    expect(habitStore.map((h) => h.id).sort()).toEqual(["mine-1", "mine-2"]);
  });
});
