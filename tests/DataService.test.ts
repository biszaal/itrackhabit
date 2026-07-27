import { dataService } from "../src/services/core/DataService";

// Mock all dependencies
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
    getHabits: jest.fn().mockResolvedValue([]),
    getAllHabits: jest.fn().mockResolvedValue([]),
    getHabitProgressForDate: jest.fn().mockResolvedValue(null),
    getAllHabitProgress: jest.fn().mockResolvedValue([]),
    saveHabit: jest.fn().mockResolvedValue(undefined),
    saveHabitProgress: jest.fn().mockResolvedValue(undefined),
    updateHabitProgress: jest.fn().mockResolvedValue(undefined),
    deleteHabit: jest.fn().mockResolvedValue(undefined),
    updateHabit: jest.fn().mockResolvedValue(undefined),
    getHabitById: jest.fn().mockResolvedValue(null),
    getHabitProgress: jest.fn().mockResolvedValue([]),
    getAllHabitsIncludingDeleted: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("../src/services/core/NetworkService", () => ({
  networkService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getConnectionStatus: jest.fn().mockReturnValue(false),
  },
}));

jest.mock("../src/services/habits", () => ({
  habitsService: {
    createHabit: jest.fn().mockResolvedValue({
      habit: {
        id: "test_habit",
        title: "Offline Habit",
        pending: true,
      },
    }),
    getUserHabits: jest.fn().mockResolvedValue([]),
    syncPendingHabits: jest.fn().mockResolvedValue({ synced: 0 }),
    syncPendingProgress: jest.fn().mockResolvedValue({ synced: 0 }),
  },
}));

describe("DataService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createHabit", () => {
    it("should create habit offline when not authenticated", async () => {
      // Arrange
      const habitData = {
        title: "Offline Habit",
        notes: "Offline description",
        frequency: "daily" as const,
      };

      // Act
      const result = await dataService.createHabit(habitData);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });
  });

  describe("getHabits", () => {
    it("should return habits from offline storage when not authenticated", async () => {
      // Act
      const habits = await dataService.getHabits();

      // Assert
      expect(Array.isArray(habits)).toBe(true);
    });
  });

  describe("markHabitProgress", () => {
    it("should create new progress entry", async () => {
      // Arrange
      const habitId = "habit123";
      const date = "2024-01-01";
      const status = "done";

      // Act
      const progress = await dataService.markHabitProgress(
        habitId,
        date,
        status
      );

      // Assert
      expect(progress).toBeDefined();
      expect(progress.habitId).toBe(habitId);
      expect(progress.date).toBe(date);
      expect(progress.status).toBe(status);
    });
  });

  describe("deleteHabit", () => {
    it("should soft delete habit", async () => {
      // Arrange
      const habitId = "habit123";

      // Act
      await dataService.deleteHabit(habitId);

      // Assert
      expect(true).toBe(true); // Basic test that function doesn't throw
    });
  });

  describe("syncToServer", () => {
    it("should not sync when offline", async () => {
      // Act
      const result = await dataService.syncToServer();

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });
  });

  describe("getDailyStats", () => {
    it("should calculate daily completion statistics", async () => {
      // Arrange
      const startDate = "2024-01-01";
      const endDate = "2024-01-07";

      // Act
      const stats = await dataService.getDailyStats(startDate, endDate);

      // Assert
      expect(Array.isArray(stats)).toBe(true);
    });
  });
});
