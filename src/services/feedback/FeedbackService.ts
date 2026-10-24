import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { FEEDBACK_API } from '../../config/feedback';

export type FeedbackCategory = 'bug' | 'idea' | 'confusing' | 'praise';
export type FeedbackSource = 'profile' | 'crash_screen';

export interface FeedbackInput {
  category: FeedbackCategory;
  message: string;
  contactEmail?: string;
  includeDeviceInfo: boolean;
  source: FeedbackSource;
}

export interface DeviceInfo {
  appVersion: string;
  platform: 'ios' | 'android';
  osVersion: string;
  deviceModel: string | null;
}

export type SubmitOutcome =
  | { status: 'sent' }
  | { status: 'queued' }
  | { status: 'rate_limited' }
  | { status: 'invalid'; message: string };

export const MAX_MESSAGE_LENGTH = 4000;
// Same shape the database checks, so a message the form accepts is never
// bounced by the server for its email.
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface Payload {
  p_category: FeedbackCategory;
  p_message: string;
  p_install_id: string;
  p_source: FeedbackSource;
  p_contact_email: string | null;
  p_app_version: string | null;
  p_platform: 'ios' | 'android' | null;
  p_os_version: string | null;
  p_device_model: string | null;
}

interface OutboxItem {
  id: string;
  /** Epoch ms before which this item is not retried. */
  notBefore: number;
  payload: Payload;
}

type PostResult = 'sent' | 'retry' | 'rate_limited' | { invalid: string };

const OUTBOX_KEY = 'feedback_outbox';
const INSTALL_ID_KEY = 'feedback_install_id';
const OUTBOX_LIMIT = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

// Cut on code points: slicing UTF-16 can split an emoji into half a
// surrogate pair, which the server rejects as invalid text.
const clip = (value: string, max: number): string => {
  const chars = Array.from(value);
  return chars.length > max ? chars.slice(0, max).join('') : value;
};

/**
 * Sends user feedback to the Supabase inbox. This is the app's only network
 * request, and only ever made when the user taps Send. Anything that cannot
 * go out now waits in an on-device outbox and is retried on launch and when
 * the app returns to the foreground.
 */
class FeedbackService {
  private flushing: Promise<void> | null = null;

  getDeviceInfo(): DeviceInfo {
    const version = Constants.expoConfig?.version ?? 'unknown';
    const build = Application.nativeBuildVersion ?? '?';
    return {
      appVersion: clip(`${version} (${build})`, 32),
      platform: Platform.OS === 'android' ? 'android' : 'ios',
      osVersion: clip(String(Platform.Version), 32),
      deviceModel: Device.modelName ? clip(Device.modelName, 64) : null,
    };
  }

  async submit(input: FeedbackInput): Promise<SubmitOutcome> {
    const payload = await this.buildPayload(input);
    const result = await this.post(payload);

    if (result === 'sent') return { status: 'sent' };
    if (result === 'retry') {
      await this.enqueue({ id: uuidv4(), notBefore: 0, payload });
      return { status: 'queued' };
    }
    if (result === 'rate_limited') {
      await this.enqueue({ id: uuidv4(), notBefore: Date.now() + DAY_MS, payload });
      return { status: 'rate_limited' };
    }
    return { status: 'invalid', message: result.invalid };
  }

  flushOutbox(): Promise<void> {
    if (!this.flushing) {
      this.flushing = this.performFlush().finally(() => {
        this.flushing = null;
      });
    }
    return this.flushing;
  }

  private async performFlush(): Promise<void> {
    const items = await this.readOutbox();
    const now = Date.now();
    const finished = new Set<string>();
    const deferred = new Map<string, number>();

    for (const item of items) {
      if (item.notBefore > now) continue;
      const result = await this.post(item.payload);
      if (result === 'rate_limited') deferred.set(item.id, now + DAY_MS);
      else if (result !== 'retry') finished.add(item.id);
    }
    if (finished.size === 0 && deferred.size === 0) return;

    // Re-read rather than writing back the snapshot, so anything submitted
    // while this flush was waiting on the network stays queued.
    const current = await this.readOutbox();
    const next = current
      .filter((item) => !finished.has(item.id))
      .map((item) =>
        deferred.has(item.id) ? { ...item, notBefore: deferred.get(item.id)! } : item
      );
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(next));
  }

  private async buildPayload(input: FeedbackInput): Promise<Payload> {
    const device = input.includeDeviceInfo ? this.getDeviceInfo() : null;
    const email = input.contactEmail?.trim();
    return {
      p_category: input.category,
      p_message: clip(input.message.trim(), MAX_MESSAGE_LENGTH),
      p_install_id: await this.getInstallId(),
      p_source: input.source,
      p_contact_email: email ? email : null,
      p_app_version: device?.appVersion ?? null,
      p_platform: device?.platform ?? null,
      p_os_version: device?.osVersion ?? null,
      p_device_model: device?.deviceModel ?? null,
    };
  }

  private async post(payload: Payload): Promise<PostResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FEEDBACK_API.timeoutMs);
    try {
      const res = await fetch(FEEDBACK_API.url, {
        method: 'POST',
        headers: {
          apikey: FEEDBACK_API.publishableKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (res.ok) return 'sent';
      if (res.status !== 400) return 'retry';

      // PostgREST answers 400 for both validation and rate-limit errors;
      // only the message tells them apart.
      const body = await res.json().catch(() => null);
      const message = typeof body?.message === 'string' ? body.message : 'Invalid feedback';
      if (message === 'rate_limited_install') return 'rate_limited';
      if (message === 'rate_limited_global') return 'retry';
      return { invalid: message };
    } catch {
      return 'retry';
    } finally {
      clearTimeout(timer);
    }
  }

  private async getInstallId(): Promise<string> {
    const existing = await AsyncStorage.getItem(INSTALL_ID_KEY);
    if (existing) return existing;
    const id = uuidv4();
    await AsyncStorage.setItem(INSTALL_ID_KEY, id);
    return id;
  }

  private async readOutbox(): Promise<OutboxItem[]> {
    try {
      const raw = await AsyncStorage.getItem(OUTBOX_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async enqueue(item: OutboxItem): Promise<void> {
    const items = await this.readOutbox();
    items.push(item);
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(items.slice(-OUTBOX_LIMIT)));
  }
}

export const feedbackService = new FeedbackService();
