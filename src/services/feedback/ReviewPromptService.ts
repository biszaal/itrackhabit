import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Linking, Platform } from 'react-native';
import { STORE_REVIEW_URL } from '../../config/feedback';

const FIRST_OPEN_KEY = 'first_open_at';
const LAST_PROMPT_KEY = 'last_review_prompt_at';
const LAST_CRASH_KEY = 'last_crash_at';

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_INSTALL_AGE_MS = 3 * DAY_MS;
const PROMPT_COOLDOWN_MS = 120 * DAY_MS;
const CRASH_QUIET_MS = 7 * DAY_MS;
const STREAK_MILESTONES = [7, 30, 100];
const COMPLETION_MILESTONE = 25;

export interface ReviewTriggerStats {
  currentStreak: number;
  totalCompletions: number;
}

const readTime = async (key: string): Promise<number | null> => {
  const raw = await AsyncStorage.getItem(key);
  const value = raw == null ? NaN : Number(raw);
  return Number.isFinite(value) ? value : null;
};

/**
 * Asks for a store rating at a good moment, and only then. Ratings drive
 * store ranking, but a prompt at the wrong time, too early or right after
 * a crash, costs more than it earns. No opinion question comes first:
 * Google Play's review policy forbids gating the prompt on one.
 */
class ReviewPromptService {
  async recordFirstOpen(now: number = Date.now()): Promise<void> {
    if ((await readTime(FIRST_OPEN_KEY)) == null) {
      await AsyncStorage.setItem(FIRST_OPEN_KEY, String(now));
    }
  }

  async recordCrash(now: number = Date.now()): Promise<void> {
    await AsyncStorage.setItem(LAST_CRASH_KEY, String(now));
  }

  isMilestone(stats: ReviewTriggerStats): boolean {
    return (
      STREAK_MILESTONES.includes(stats.currentStreak) ||
      stats.totalCompletions === COMPLETION_MILESTONE
    );
  }

  async maybePrompt(stats: ReviewTriggerStats, now: number = Date.now()): Promise<boolean> {
    if (!this.isMilestone(stats)) return false;

    const [firstOpen, lastPrompt, lastCrash] = await Promise.all([
      readTime(FIRST_OPEN_KEY),
      readTime(LAST_PROMPT_KEY),
      readTime(LAST_CRASH_KEY),
    ]);
    if (firstOpen == null || now - firstOpen < MIN_INSTALL_AGE_MS) return false;
    if (lastPrompt != null && now - lastPrompt < PROMPT_COOLDOWN_MS) return false;
    if (lastCrash != null && now - lastCrash < CRASH_QUIET_MS) return false;
    if (!(await StoreReview.isAvailableAsync())) return false;

    // Claimed before asking, so a second milestone landing while the sheet
    // is up sees the cooldown instead of prompting again.
    await AsyncStorage.setItem(LAST_PROMPT_KEY, String(now));
    await StoreReview.requestReview();
    return true;
  }

  async openStorePage(): Promise<void> {
    const { primary, fallback } =
      Platform.OS === 'android' ? STORE_REVIEW_URL.android : STORE_REVIEW_URL.ios;
    try {
      await Linking.openURL(primary);
    } catch (error) {
      if (!fallback) throw error;
      await Linking.openURL(fallback);
    }
  }
}

export const reviewPromptService = new ReviewPromptService();
