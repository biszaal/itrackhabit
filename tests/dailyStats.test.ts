import { dataService } from "../src/services/core/DataService";
import { offlineStorage } from "../src/services/core/OfflineStorage";
import { calculateHabitStats } from "../src/utils/helpers/habits";
import { toLocalISODate } from "../src/utils/formatting/time";

jest.mock("../src/services/auth", () => ({
  authService: {
    getCurrentUser: jest.fn().mockResolvedValue(null),
    isAuthenticated: jest.fn().mockReturnValue(false),
    addAuthListener: jest.fn().mockReturnValue(() => {}),
  },
}));

jest.mock("../src/services/core/NetworkService", () => ({
  networkService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getConnectionStatus: jest.fn().mockReturnValue(false),
  },
}));

jest.mock("../src/services/core/OfflineStorage", () => ({
  offlineStorage: {
    getHabits: jest.fn(),
    getAllHabits: jest.fn(),
    getAllHabitProgress: jest.fn(),
    getProgressInRange: jest.fn(),
    getHabitProgress: jest.fn(),
    getHabitProgressForDate: jest.fn(),
  },
}));

const storage = offlineStorage as unknown as Record<string, jest.Mock>;

beforeEach(() => {
  for (const fn of Object.values(storage)) fn.mockReset();
  storage.getHabits.mockResolvedValue([]);
  storage.getAllHabits.mockResolvedValue([]);
  storage.getAllHabitProgress.mockResolvedValue([]);
  storage.getProgressInRange.mockResolvedValue([]);
  storage.getHabitProgress.mockResolvedValue([]);
  storage.getHabitProgressForDate.mockResolvedValue(null);
});

describe("getDailyStats", () => {
  // Run under TZ=Europe/London (CI does) to exercise the bug: walking UTC
  // midnights repeated 28 March and dropped 1 April.
  it("walks every calendar day once across the spring clock change", async () => {
    const stats = await dataService.getDailyStats("2027-03-25", "2027-04-01");
    expect(stats.map((d) => d.date)).toEqual([
      "2027-03-25", "2027-03-26", "2027-03-27", "2027-03-28",
      "2027-03-29", "2027-03-30", "2027-03-31", "2027-04-01",
    ]);
  });

  it("counts done habits per day from one range query", async () => {
    storage.getAllHabits.mockResolvedValue([
      { id: "h1", createdAt: "2027-03-01T09:00:00.000Z" },
      { id: "h2", createdAt: "2027-03-27T09:00:00.000Z", deletedAt: "2027-03-30T10:00:00.000Z" },
    ]);
    storage.getProgressInRange.mockResolvedValue([
      { habitId: "h1", date: "2027-03-26", status: "done" },
      { habitId: "h1", date: "2027-03-27", status: "skip" },
      { habitId: "h1", date: "2027-03-28", status: "done" },
      { habitId: "h2", date: "2027-03-28", status: "done" },
      { habitId: "h2", date: "2027-03-29", status: "done" },
    ]);

    const stats = await dataService.getDailyStats("2027-03-25", "2027-03-31");

    expect(storage.getProgressInRange).toHaveBeenCalledTimes(1);
    expect(storage.getProgressInRange).toHaveBeenCalledWith("offline_user", "2027-03-25", "2027-03-31");
    expect(storage.getHabitProgressForDate).not.toHaveBeenCalled();
    expect(stats.map(({ date, totalHabits, completedHabits, completionRate }) =>
      [date, totalHabits, completedHabits, completionRate])).toEqual([
      ["2027-03-25", 1, 0, 0],
      ["2027-03-26", 1, 1, 100],
      ["2027-03-27", 2, 0, 0],
      ["2027-03-28", 2, 2, 100],
      ["2027-03-29", 2, 1, 50],
      ["2027-03-30", 2, 0, 0],
      ["2027-03-31", 1, 0, 0],
    ]);
  });

  it("returns nothing for an unparseable range", async () => {
    expect(await dataService.getDailyStats("nope", "2027-03-31")).toEqual([]);
  });
});

describe("getHabitsWithStats", () => {
  it("loads every habit's progress in one query", async () => {
    const today = new Date();
    const day = (n: number) => toLocalISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - n));
    const created = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10).toISOString();
    storage.getHabits.mockResolvedValue([
      { id: "h1", title: "Read", frequency: "daily", createdAt: created },
      { id: "h2", title: "Run", frequency: "daily", createdAt: created },
    ]);
    const h1 = [0, 1, 2].map((n) => ({ habitId: "h1", date: day(n), status: "done" }));
    const h2 = [{ habitId: "h2", date: day(0), status: "done" }];
    storage.getAllHabitProgress.mockResolvedValue([...h1, ...h2]);

    const habits = await dataService.getHabitsWithStats();

    expect(storage.getAllHabitProgress).toHaveBeenCalledTimes(1);
    expect(storage.getHabitProgress).not.toHaveBeenCalled();
    expect(habits[0]).toMatchObject(calculateHabitStats(h1, { createdAt: created, frequency: "daily" }));
    expect(habits[1]).toMatchObject(calculateHabitStats(h2, { createdAt: created, frequency: "daily" }));
    expect(habits[0].currentStreak).toBe(3);
  });
});
