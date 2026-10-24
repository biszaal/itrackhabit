const mockDb = {
  execAsync: jest.fn(),
  runAsync: jest.fn(),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  closeAsync: jest.fn(),
};

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(async () => mockDb),
}));

import { offlineStorage } from "../src/services/core/OfflineStorage";

const sqlOf = (fn: jest.Mock) => fn.mock.calls.map((call) => String(call[0]));

beforeEach(async () => {
  await offlineStorage.close();
  for (const fn of Object.values(mockDb)) fn.mockReset();
  mockDb.execAsync.mockResolvedValue(undefined);
  mockDb.runAsync.mockResolvedValue(undefined);
  mockDb.getAllAsync.mockResolvedValue([]);
  mockDb.getFirstAsync.mockResolvedValue(null);
  mockDb.closeAsync.mockResolvedValue(undefined);
});

describe("OfflineStorage", () => {
  it("creates an index on progress dates", async () => {
    await offlineStorage.initialize();
    expect(
      sqlOf(mockDb.execAsync).some((sql) =>
        sql.includes("CREATE INDEX IF NOT EXISTS idx_progress_date")
      )
    ).toBe(true);
  });

  it("clears the unused sync queue once", async () => {
    await offlineStorage.initialize();
    expect(sqlOf(mockDb.runAsync)).toContain("DELETE FROM sync_queue");

    await offlineStorage.close();
    mockDb.runAsync.mockClear();
    mockDb.getFirstAsync.mockImplementation(async (_sql: string, params?: unknown[]) =>
      params?.[0] === "sync_queue_purged_v1" ? { value: "true" } : null
    );
    await offlineStorage.initialize();
    expect(sqlOf(mockDb.runAsync)).not.toContain("DELETE FROM sync_queue");
  });

  it("does not queue sync work in offline-only mode", async () => {
    await offlineStorage.initialize();
    mockDb.runAsync.mockClear();

    await offlineStorage.saveHabitProgress({
      id: "p1",
      habitId: "h1",
      date: "2026-10-24",
      status: "done",
      updatedAt: "2026-10-24T09:00:00.000Z",
      pending: true,
    } as any);

    const sql = sqlOf(mockDb.runAsync);
    expect(sql.some((s) => s.includes("INSERT OR REPLACE INTO habit_progress"))).toBe(true);
    expect(sql.some((s) => s.includes("sync_queue"))).toBe(false);
  });

  it("loads a date range in one query", async () => {
    await offlineStorage.initialize();
    mockDb.getAllAsync.mockImplementation(async (sql: string) =>
      sql.includes("BETWEEN")
        ? [{ id: "p1", habitId: "h1", date: "2026-10-02", status: "done", updatedAt: "x", pending: 0 }]
        : []
    );

    const rows = await offlineStorage.getProgressInRange("offline_user", "2026-10-01", "2026-10-07");

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: "p1", habitId: "h1", date: "2026-10-02", status: "done" });
    const rangeCall = mockDb.getAllAsync.mock.calls.find((c) => String(c[0]).includes("BETWEEN"));
    expect(rangeCall?.[1]).toEqual(["offline_user", "2026-10-01", "2026-10-07"]);
  });

  it("keeps a habit whose JSON column is corrupt", async () => {
    await offlineStorage.initialize();
    mockDb.getAllAsync.mockImplementation(async (sql: string) =>
      sql.includes("FROM habits WHERE userId")
        ? [{
            id: "h1", userId: "offline_user", title: "Read", frequency: "daily",
            isShared: 0, pending: 0, targetConfig: "{not json", microSteps: "[",
            createdAt: "2026-10-01T09:00:00.000Z", updatedAt: "2026-10-01T09:00:00.000Z",
          }]
        : []
    );

    const habits = await offlineStorage.getHabits("offline_user");

    expect(habits).toHaveLength(1);
    expect(habits[0].title).toBe("Read");
    expect(habits[0].targetConfig).toBeUndefined();
    expect(habits[0].microSteps).toBeUndefined();
  });

  it("keeps a progress row whose JSON column is corrupt", async () => {
    await offlineStorage.initialize();
    mockDb.getAllAsync.mockImplementation(async (sql: string) =>
      sql.includes("WHERE habitId = ?")
        ? [{ id: "p1", habitId: "h1", date: "2026-10-02", status: "done", microStepsDone: "[oops", updatedAt: "x", pending: 0 }]
        : []
    );

    const rows = await offlineStorage.getHabitProgress("h1");

    expect(rows).toHaveLength(1);
    expect(rows[0].microStepsDone).toBeUndefined();
  });
});
