import AsyncStorage from "@react-native-async-storage/async-storage";
import { enhancedNotificationService } from "../src/services/notifications/EnhancedNotificationService";
import { dataService } from "../src/services/core/DataService";

jest.mock("../src/services/core/DataService");
jest.mock("expo-notifications", () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notif-1"),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockData = dataService as jest.Mocked<typeof dataService>;

describe("EnhancedNotificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockData.getHabits.mockResolvedValue([
      { id: "h1", title: "Read", deletedAt: null } as any,
    ]);
    mockData.getHabitProgress.mockResolvedValue([]);
  });

  describe("getNotificationInsights", () => {
    // Smart timing overrides the user's chosen reminder times, so a permanently
    // frozen cache means the app nudges at hours the user never picked and the
    // UI never shows.
    it("recomputes insights once the cached copy is stale", async () => {
      const stale = Date.now() - 8 * 24 * 60 * 60 * 1000;
      mockStorage.getItem.mockResolvedValue(
        JSON.stringify({
          optimalTimes: [3],
          responseRate: 0,
          bestPerformingTime: 3,
          streakRiskHours: [22, 23],
          computedAt: stale,
        })
      );
      mockData.getHabitProgress.mockResolvedValue([
        { date: "2026-09-01", status: "done", updatedAt: "2026-09-01T14:00:00Z" },
        { date: "2026-09-02", status: "done", updatedAt: "2026-09-02T14:00:00Z" },
      ] as any);

      const insights = await enhancedNotificationService.getNotificationInsights("h1");

      expect(mockData.getHabitProgress).toHaveBeenCalled();
      expect(insights.optimalTimes).not.toEqual([3]);
    });

    it("reuses a fresh cached copy without recomputing", async () => {
      mockStorage.getItem.mockResolvedValue(
        JSON.stringify({
          optimalTimes: [9],
          responseRate: 50,
          bestPerformingTime: 9,
          streakRiskHours: [22, 23],
          computedAt: Date.now(),
        })
      );

      const insights = await enhancedNotificationService.getNotificationInsights("h1");

      expect(insights.optimalTimes).toEqual([9]);
      expect(mockData.getHabitProgress).not.toHaveBeenCalled();
    });

    it("recomputes a cache entry written before staleness was tracked", async () => {
      mockStorage.getItem.mockResolvedValue(
        JSON.stringify({
          optimalTimes: [3],
          responseRate: 0,
          bestPerformingTime: 3,
          streakRiskHours: [22, 23],
        })
      );

      await enhancedNotificationService.getNotificationInsights("h1");

      expect(mockData.getHabitProgress).toHaveBeenCalled();
    });
  });

  describe("saveHabitReminderSettings", () => {
    // The settings screen shows "Could not save" on a rejection. Swallowing the
    // error made that alert unreachable and reported success on every failure.
    it("rejects when the write fails", async () => {
      mockStorage.setItem.mockRejectedValue(new Error("disk full"));

      await expect(
        enhancedNotificationService.saveHabitReminderSettings({
          habitId: "h1",
          enabled: true,
          reminderTimes: ["09:00"],
          smartTiming: false,
          streakProtection: false,
          motivationalStyle: "encouraging",
          weekdaysOnly: false,
        })
      ).rejects.toThrow();
    });

    it("drops cached insights so smart timing re-learns after a change", async () => {
      mockStorage.setItem.mockResolvedValue(undefined);
      mockStorage.getItem.mockResolvedValue(null);

      await enhancedNotificationService.saveHabitReminderSettings({
        habitId: "h1",
        enabled: true,
        reminderTimes: ["09:00"],
        smartTiming: true,
        streakProtection: false,
        motivationalStyle: "encouraging",
        weekdaysOnly: false,
      });

      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        expect.stringContaining("notification_insights_h1")
      );
    });
  });
});
