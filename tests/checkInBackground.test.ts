import { dataService } from "../src/services/core/DataService";
import { achievementService } from "../src/services/premium/AchievementService";
import { reviewPromptService } from "../src/services/feedback/ReviewPromptService";
import { socialService } from "../src/services/social/SocialService";

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
    getHabitProgressForDate: jest.fn().mockResolvedValue(null),
    saveHabitProgress: jest.fn().mockResolvedValue(undefined),
    updateHabitProgress: jest.fn().mockResolvedValue(undefined),
    getHabit: jest.fn().mockResolvedValue({
      id: "h1", title: "Read", frequency: "daily", createdAt: "2026-01-01T09:00:00.000Z",
    }),
    getHabitProgress: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("../src/services/premium/AchievementService", () => ({
  achievementService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    checkForNewAchievements: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("../src/services/feedback/ReviewPromptService", () => ({
  reviewPromptService: { maybePrompt: jest.fn().mockResolvedValue(false) },
}));

jest.mock("../src/services/social/SocialService", () => ({
  socialService: { initialize: jest.fn(), trackHabitCompletion: jest.fn() },
}));

const achievements = achievementService as unknown as Record<string, jest.Mock>;
const review = reviewPromptService as unknown as Record<string, jest.Mock>;
const social = socialService as unknown as Record<string, jest.Mock>;

beforeEach(async () => {
  jest.clearAllMocks();
  (dataService as any).isInitialized = true;
  await dataService.afterCompletionIdle();
});

describe("markHabitProgress", () => {
  it("returns before achievement work finishes", async () => {
    let release!: () => void;
    achievements.checkForNewAchievements.mockImplementationOnce(
      () => new Promise<void>((resolve) => { release = resolve; })
    );

    const saved = await dataService.markHabitProgress("h1", "2026-10-24", "done");

    expect(saved.status).toBe("done");
    expect(review.maybePrompt).not.toHaveBeenCalled();
    // The save returns before the background job has even started, so wait
    // for it to reach the achievement check before letting that finish.
    while (!release) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    release();
    await dataService.afterCompletionIdle();
    expect(review.maybePrompt).toHaveBeenCalledWith(
      expect.objectContaining({ currentStreak: expect.any(Number), totalCompletions: expect.any(Number) })
    );
  });

  it("never touches the old social activity feed", async () => {
    await dataService.markHabitProgress("h1", "2026-10-24", "done");
    await dataService.afterCompletionIdle();
    expect(social.trackHabitCompletion).not.toHaveBeenCalled();
  });

  it("queues no work for a skipped habit", async () => {
    await dataService.markHabitProgress("h1", "2026-10-24", "skipped");
    await dataService.afterCompletionIdle();
    expect(achievements.checkForNewAchievements).not.toHaveBeenCalled();
    expect(review.maybePrompt).not.toHaveBeenCalled();
  });

  it("runs after-completion jobs one at a time", async () => {
    const order: string[] = [];
    achievements.checkForNewAchievements.mockImplementation(async () => {
      order.push("achievements");
      return [];
    });
    review.maybePrompt.mockImplementation(async () => {
      order.push("review");
      return false;
    });

    await dataService.markHabitProgress("h1", "2026-10-24", "done");
    await dataService.markHabitProgress("h1", "2026-10-23", "done");
    await dataService.afterCompletionIdle();

    expect(order).toEqual(["achievements", "review", "achievements", "review"]);
  });

  it("keeps going after a failed job", async () => {
    achievements.checkForNewAchievements.mockRejectedValueOnce(new Error("boom"));
    await dataService.markHabitProgress("h1", "2026-10-24", "done");
    await dataService.markHabitProgress("h1", "2026-10-23", "done");
    await dataService.afterCompletionIdle();
    expect(review.maybePrompt).toHaveBeenCalledTimes(2);
  });
});
