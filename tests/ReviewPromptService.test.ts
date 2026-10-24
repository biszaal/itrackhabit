import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { Linking, Platform } from "react-native";
import { reviewPromptService } from "../src/services/feedback/ReviewPromptService";

jest.mock("expo-store-review", () => ({
  isAvailableAsync: jest.fn(),
  requestReview: jest.fn(),
}));

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 24, 12);
const store: Record<string, string> = {};
const review = StoreReview as unknown as Record<string, jest.Mock>;

const installedDaysAgo = (days: number) => {
  store.first_open_at = String(NOW - days * DAY);
};

beforeEach(() => {
  for (const key of Object.keys(store)) delete store[key];
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (k: string) => store[k] ?? null);
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (k: string, v: string) => {
    store[k] = v;
  });
  review.isAvailableAsync.mockReset().mockResolvedValue(true);
  review.requestReview.mockReset().mockResolvedValue(undefined);
});

describe("ReviewPromptService.maybePrompt", () => {
  it("prompts on a 7-day streak once installed for 3 days", async () => {
    installedDaysAgo(3);
    expect(await reviewPromptService.maybePrompt({ currentStreak: 7, totalCompletions: 9 }, NOW)).toBe(true);
    expect(review.requestReview).toHaveBeenCalledTimes(1);
    expect(store.last_review_prompt_at).toBe(String(NOW));
  });

  it.each([
    [{ currentStreak: 30, totalCompletions: 40 }, true],
    [{ currentStreak: 100, totalCompletions: 140 }, true],
    [{ currentStreak: 2, totalCompletions: 25 }, true],
    [{ currentStreak: 8, totalCompletions: 9 }, false],
    [{ currentStreak: 6, totalCompletions: 24 }, false],
  ])("treats %o as a milestone: %s", async (stats, expected) => {
    installedDaysAgo(10);
    expect(await reviewPromptService.maybePrompt(stats, NOW)).toBe(expected);
  });

  it("waits until the app has been installed for 3 days", async () => {
    installedDaysAgo(2);
    expect(await reviewPromptService.maybePrompt({ currentStreak: 7, totalCompletions: 7 }, NOW)).toBe(false);
  });

  it("never prompts when the first open was not recorded", async () => {
    expect(await reviewPromptService.maybePrompt({ currentStreak: 7, totalCompletions: 7 }, NOW)).toBe(false);
  });

  it("waits 120 days between prompts", async () => {
    installedDaysAgo(400);
    store.last_review_prompt_at = String(NOW - 119 * DAY);
    expect(await reviewPromptService.maybePrompt({ currentStreak: 30, totalCompletions: 30 }, NOW)).toBe(false);
    store.last_review_prompt_at = String(NOW - 121 * DAY);
    expect(await reviewPromptService.maybePrompt({ currentStreak: 30, totalCompletions: 30 }, NOW)).toBe(true);
  });

  it("stays quiet for 7 days after a crash", async () => {
    installedDaysAgo(30);
    store.last_crash_at = String(NOW - 6 * DAY);
    expect(await reviewPromptService.maybePrompt({ currentStreak: 7, totalCompletions: 7 }, NOW)).toBe(false);
    store.last_crash_at = String(NOW - 8 * DAY);
    expect(await reviewPromptService.maybePrompt({ currentStreak: 7, totalCompletions: 7 }, NOW)).toBe(true);
  });

  it("does nothing when the store review sheet is unavailable", async () => {
    installedDaysAgo(30);
    review.isAvailableAsync.mockResolvedValue(false);
    expect(await reviewPromptService.maybePrompt({ currentStreak: 7, totalCompletions: 7 }, NOW)).toBe(false);
    expect(store.last_review_prompt_at).toBeUndefined();
  });

  it("two milestone calls back to back prompt once", async () => {
    installedDaysAgo(30);
    await reviewPromptService.maybePrompt({ currentStreak: 7, totalCompletions: 7 }, NOW);
    await reviewPromptService.maybePrompt({ currentStreak: 30, totalCompletions: 25 }, NOW + 1000);
    expect(review.requestReview).toHaveBeenCalledTimes(1);
  });
});

describe("ReviewPromptService bookkeeping", () => {
  it("records the first open only once", async () => {
    await reviewPromptService.recordFirstOpen(NOW);
    await reviewPromptService.recordFirstOpen(NOW + DAY);
    expect(store.first_open_at).toBe(String(NOW));
  });

  it("records a crash", async () => {
    await reviewPromptService.recordCrash(NOW);
    expect(store.last_crash_at).toBe(String(NOW));
  });
});

describe("ReviewPromptService.openStorePage", () => {
  // React Native's jest setup already mocks Linking.openURL, so spyOn hands
  // back that same mock and its calls would carry over between tests.
  beforeEach(() => {
    jest.spyOn(Linking, "openURL").mockReset();
  });
  afterEach(() => jest.restoreAllMocks());

  it("opens the App Store write-review page on iOS", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await reviewPromptService.openStorePage();
    expect(open).toHaveBeenCalledWith("https://apps.apple.com/app/id6751805707?action=write-review");
  });

  it("falls back to the Play web page when the Play app cannot open", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    const open = jest
      .spyOn(Linking, "openURL")
      .mockRejectedValueOnce(new Error("no handler"))
      .mockResolvedValueOnce(true);
    await reviewPromptService.openStorePage();
    expect(open).toHaveBeenNthCalledWith(1, "market://details?id=com.biszaal.itrackhabit");
    expect(open).toHaveBeenNthCalledWith(2, "https://play.google.com/store/apps/details?id=com.biszaal.itrackhabit");
  });
});
