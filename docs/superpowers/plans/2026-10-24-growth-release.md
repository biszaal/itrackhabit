# iTrackHabit 1.1.0 Growth Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship iOS 1.1.0 with in-app feedback, a rating prompt, a crash screen, and the speed and correctness fixes long-time users need.

**Architecture:** The app stays offline-first. Habit data never leaves the device. The only network call is a user-initiated POST to a Supabase Postgres function (`submit_feedback`, already deployed). Two small services, `FeedbackService` (send plus an offline outbox) and `ReviewPromptService` (when to ask for a rating), live in `src/services/feedback/`. The speed work replaces per-habit and per-day SQLite queries with one query per screen load. It also moves post-check-in work (achievements, rating prompt) off the tap's critical path.

**Tech Stack:** Expo SDK 53, React Native 0.79.6 (old architecture), TypeScript 5.8, expo-sqlite, AsyncStorage, Jest 29 via jest-expo with @testing-library/react-native 13, EAS Build.

**Spec:** `docs/superpowers/specs/2026-10-23-growth-release-design.md` (Part 1, the Supabase inbox, is done: commit `03769dc`).

## Global Constraints

- **Working directory:** `/Users/bishalaryal/Documents/Github/iTrackHabit/frontend`. That is the git repo. The parent folder is a different repo.
- **Native modules:** install with `npx expo install <pkg>` only, so versions match SDK 53. Expected versions:
  - expo-store-review ~8.1.5
  - expo-application ~6.1.5
  - expo-system-ui ~5.0.11
  - expo-dev-client: whatever `expo install` picks for SDK 53
- **No analytics, crash-reporting or tracking SDKs.** The only new network request is the feedback POST.
- `LOCAL_ONLY` in `src/config/runtime.ts` stays `true`.
- **Day keys are local calendar dates** (`toLocalISODate`, `parseDayKey`). Never use `toISOString().split('T')[0]` for a day.
- **Tests must pass under four timezones:** `TZ=UTC`, `TZ=America/Los_Angeles`, `TZ=Pacific/Auckland`, `TZ=Europe/London`.
- **Commit messages: never add `Co-Authored-By` or "Generated with Claude" lines.** This is the user's standing rule. Write messages in this repo's style: an imperative subject, then a body explaining why.
- **Code style:** match the file you are in. `DataService.ts` and `OfflineStorage.ts` use double quotes; screens and most other services use single quotes. Comments explain *why*.
- **User-facing copy is verbatim from the spec:**
  - Chip labels: "Something's broken", "I have an idea", "Something's confusing", "I love something"
  - Result: "Thank you — we read every message."
  - Queued: "Saved. It'll send automatically when you're back online."
  - Rate-limited: "Thanks for all the feedback today! This one will send tomorrow."
  - Privacy line: "This sends only what you see here. Your habits stay on your device."
  - Crash screen: "Something went wrong." and "Your habits are safe on this device."
- **Feedback endpoint:** `https://abpyvxtteulfyhprmaad.supabase.co/rest/v1/rpc/submit_feedback`, header `apikey: sb_publishable_nICy1-CokF8dhTEUIBiJEQ_RbEmtOdD`. Both are public by design.
- **Limits:** message 1–4000 characters; email ≤ 254; app_version ≤ 32; os_version ≤ 32; device_model ≤ 64. Outbox ≤ 20 items. Request timeout 10 s.
- **Rating prompt rules:**
  - Installed ≥ 3 days; last prompt ≥ 120 days ago; last crash ≥ 7 days ago.
  - Triggers: current streak exactly 7, 30 or 100, or total completions exactly 25 (of the habit just completed).
- **The database password is never written to any file.** Pass it only as an environment variable for the single command that needs it.

## Review Focus

- **App killed while feedback waits in the outbox:** it must still send on the next launch. Test in Task 5: "sends feedback left in the outbox by an earlier run".
- **Send tapped twice quickly:** exactly one submission. Test in Task 6: "sends once when Send is tapped twice".
- **Emoji-heavy message cut at the limit:** must be cut on a code-point boundary, never leaving half a surrogate pair, which Postgres would reject. Test in Task 5: "truncates on whole characters, not UTF-16 halves".
- **Something fails inside the crash screen** (export throws): the screen shows a message and must not crash again. Test in Task 7: "reports an export failure without crashing".
- **Two milestone check-ins in quick succession:** at most one rating prompt. Tests in Task 3 ("two milestone calls back to back prompt once") and Task 4 ("runs after-completion jobs one at a time").

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `src/services/core/OfflineStorage.ts` | Modify | Range query, date index, safe JSON parsing, no sync queue in offline mode |
| `src/utils/helpers/habits.ts` | Modify | Export the existing `parseDayKey` and `addDays` |
| `src/services/core/DataService.ts` | Modify | Batched stats, local-date walk, background after-completion work |
| `src/config/feedback.ts` | Create | Public endpoint, key and store URLs |
| `src/services/feedback/ReviewPromptService.ts` | Create | Rating-prompt eligibility, store page |
| `src/services/feedback/FeedbackService.ts` | Create | Payload, POST, outcome mapping, outbox |
| `src/components/ds/Field.tsx` | Modify | Multiline support |
| `src/screens/settings/FeedbackScreen.tsx` | Create | Feedback form |
| `src/types/navigation.ts`, `src/navigation/index.tsx` | Modify | `Feedback` route |
| `src/screens/settings/ProfileScreen.tsx` | Modify | "Send feedback" and "Rate iTrackHabit" rows |
| `src/components/ErrorBoundary.tsx` | Create | Crash screen |
| `App.tsx` | Modify | Wrap in ErrorBoundary; outbox flush and first-open on launch and foreground |
| `src/screens/settings/DeveloperToolsScreen.tsx` | Modify | "Throw test error" (dev only) |
| `src/hooks/useAnalytics.ts`, `src/screens/HomeScreen.tsx` | Modify | Dev-only `[perf]` timing logs |
| `app.json`, `store.json`, `PRIVACY_POLICY.md` | Modify | Dark mode, 1.1.0, privacy and listing copy |
| `.github/workflows/ci.yml` | Modify | Europe/London test run |
| `tests/*.test.ts(x)` | Create | One file per task, named in each task |

---

### Task 0: Native modules, dev client, baseline timings

The four native modules go in first, so that **one** Android dev-client build serves both the before and the after measurements. JavaScript changes after this reach the phone through Metro without rebuilding.

**Files:**
- Modify: `package.json`, `package-lock.json` (via `npx expo install`)
- Modify: `src/hooks/useAnalytics.ts:60-90`
- Modify: `src/screens/HomeScreen.tsx:203-205`

**Interfaces:**
- Produces: installed packages `expo-store-review`, `expo-application`, `expo-system-ui`, `expo-dev-client`; dev-only log lines `[perf] analytics load <n>ms` and `[perf] check-in saved <n>ms`.

- [ ] **Step 1: Install the native modules**

Run: `npx expo install expo-store-review expo-application expo-system-ui expo-dev-client`

Expected: `package.json` gains all four. The versions are the SDK 53 ones (see Global Constraints).

- [ ] **Step 2: Add the dev-only timing logs**

In `src/hooks/useAnalytics.ts`, change the top of `loadAnalytics`:

```ts
  const loadAnalytics = useCallback(async () => {
    // Dev-only timing, read from the device log to compare builds.
    const startedAt = Date.now();
    try {
```

Add this directly after the `setAnalyticsData({ ... });` call closes (the line `});` before the blank line and `} catch (error) {`):

```ts
      if (__DEV__) console.log(`[perf] analytics load ${Date.now() - startedAt}ms`);
```

In `src/screens/HomeScreen.tsx`, `handleToggleHabit`, replace:

```ts
      const saved = await dataService.markHabitProgress(habit.id, selectedISO, newStatus);
      setDayProgress((prev) => ({ ...prev, [habit.id]: saved }));
```

with:

```ts
      const tapAt = Date.now();
      const saved = await dataService.markHabitProgress(habit.id, selectedISO, newStatus);
      // Dev-only timing, read from the device log to compare builds.
      if (__DEV__) console.log(`[perf] check-in saved ${Date.now() - tapAt}ms`);
      setDayProgress((prev) => ({ ...prev, [habit.id]: saved }));
```

- [ ] **Step 3: Verify nothing broke**

Run: `npx tsc --noEmit && npx eslint src/ tests/ --quiet && TZ=UTC npx jest --ci`

Expected: exit 0, and `Tests: 63 passed`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/hooks/useAnalytics.ts src/screens/HomeScreen.tsx
git commit -m "Add the 1.1.0 native modules and dev-only timing logs

Installing store-review, application, system-ui and dev-client up
front lets one Android dev build cover every later JavaScript change.
The [perf] logs give before-and-after numbers for the stats rewrite."
```

- [ ] **Step 5: Build and install the Android dev client**

Run: `npx eas-cli whoami`

Expected: an Expo account that owns `biszaaltech`. If it says you are not logged in, stop and ask the user to run `npx eas-cli login`; it is interactive.

Run: `npx eas-cli build --profile development --platform android --non-interactive`

Expected: the build finishes and prints an APK URL. Download it to the scratchpad, then:

Run: `adb -s R5GL75ZVW1B install -r <path-to-apk>`

Expected: `Success`.

- [ ] **Step 6: Record the baseline**

Run these in separate terminals:
- `npx expo start --dev-client`
- `adb -s R5GL75ZVW1B reverse tcp:8081 tcp:8081`

Then:
1. Open iTrackHabit on the phone.
2. Go to Profile → Developer tools → **Add demo data**. This adds 6 habits with about four months of history.
3. Open the Analytics tab 3 times, leaving it in between.
4. On the Habits tab, toggle 3 habits done.

Run: `adb -s R5GL75ZVW1B logcat -d -s ReactNativeJS | grep "\[perf\]"`

Fill the "Before" column of the Measurements table at the end of this plan with the median of each kind.

---

### Task 1: OfflineStorage — range query, date index, safe JSON, no sync queue

**Files:**
- Modify: `src/services/core/OfflineStorage.ts`
- Test: `tests/OfflineStorage.test.ts` (create)

**Interfaces:**
- Produces: `offlineStorage.getProgressInRange(userId: string, startDate: string, endDate: string): Promise<HabitProgress[]>`. It is one query; `startDate` and `endDate` are inclusive `YYYY-MM-DD` keys.
- Existing, reused later: `offlineStorage.getAllHabitProgress(userId: string): Promise<HabitProgress[]>`. It is one query for every habit's progress.

- [ ] **Step 1: Write the failing tests**

Create `tests/OfflineStorage.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/OfflineStorage.test.ts`

Expected: the date-index, purge, sync-queue, range and corrupt-JSON tests fail. For example: `offlineStorage.getProgressInRange is not a function`, `SyntaxError: Unexpected token`, and `expected … toContain "DELETE FROM sync_queue"`.

- [ ] **Step 3: Implement**

In `src/services/core/OfflineStorage.ts`, add below the existing imports:

```ts
import { LOCAL_ONLY } from "../../config/runtime";

const SYNC_QUEUE_PURGED_KEY = "sync_queue_purged_v1";

// A malformed JSON column used to throw out of the row mapper and take the
// whole habit list down with it. Now only that one field is lost.
function safeParse<T>(raw: string | null | undefined, column: string): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Ignoring malformed JSON in ${column}:`, error);
    return undefined;
  }
}
```

In `initialize()`, replace:

```ts
      // Check and fix schema issues
      await this.checkAndFixSchema();

      this.isInitialized = true;
```

with:

```ts
      // Check and fix schema issues
      await this.checkAndFixSchema();
      await this.purgeSyncQueueOnce();

      this.isInitialized = true;
```

Add this method directly after `initialize()`:

```ts
  // v1 is offline-only, so nothing ever drains the sync queue; every
  // check-in used to add rows to it forever. Rows written by earlier builds
  // are cleared once.
  private async purgeSyncQueueOnce(): Promise<void> {
    if (!LOCAL_ONLY || !this.db) return;
    try {
      if ((await this.getMetadata(SYNC_QUEUE_PURGED_KEY)) === "true") return;
      await this.db.runAsync(`DELETE FROM sync_queue`);
      await this.setMetadata(SYNC_QUEUE_PURGED_KEY, "true");
    } catch (error) {
      console.warn("Could not clear the unused sync queue:", error);
    }
  }
```

In `createTables()`, directly after the `habit_progress` `CREATE TABLE` statement's `await this.db.execAsync(...)` call, add:

```ts
    // Range reads (calendar, analytics, achievements) filter on date alone,
    // which the (habitId, date) unique index cannot serve.
    await this.db.execAsync(
      `CREATE INDEX IF NOT EXISTS idx_progress_date ON habit_progress (date);`
    );
```

In `addToSyncQueue(...)`, make the first line of the body:

```ts
    // Offline-only builds have no server to sync to; see purgeSyncQueueOnce.
    if (LOCAL_ONLY) return;
```

In `mapRowToHabit`, replace the three JSON lines:

```ts
      healthConfig: row.healthConfig ? JSON.parse(row.healthConfig) : undefined,
      targetConfig: row.targetConfig ? JSON.parse(row.targetConfig) : undefined,
```

and

```ts
      microSteps: row.microSteps ? JSON.parse(row.microSteps) : undefined,
```

with:

```ts
      healthConfig: safeParse(row.healthConfig, "habits.healthConfig"),
      targetConfig: safeParse(row.targetConfig, "habits.targetConfig"),
```

and

```ts
      microSteps: safeParse(row.microSteps, "habits.microSteps"),
```

In `mapRowToHabitProgress`, replace:

```ts
      microStepsDone: row.microStepsDone
        ? JSON.parse(row.microStepsDone)
        : undefined,
```

with:

```ts
      microStepsDone: safeParse(row.microStepsDone, "habit_progress.microStepsDone"),
```

Add this method directly after `getHabitProgressForDate(...)`:

```ts
  // One query for a whole date range. Callers used to ask per habit per
  // day, which for a year of history meant thousands of round trips.
  async getProgressInRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<HabitProgress[]> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.getAllAsync(
      `SELECT hp.* FROM habit_progress hp
       JOIN habits h ON hp.habitId = h.id
       WHERE h.userId = ? AND hp.date BETWEEN ? AND ?`,
      [userId, startDate, endDate]
    );
    return result.map((row) => this.mapRowToHabitProgress(row as any));
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/OfflineStorage.test.ts && npx tsc --noEmit`

Expected: 6 passed, and tsc exits 0.

- [ ] **Step 5: Run the whole suite**

Run: `TZ=UTC npx jest --ci`

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/services/core/OfflineStorage.ts tests/OfflineStorage.test.ts
git commit -m "Read progress ranges in one query and stop growing the sync queue

Adds getProgressInRange and an index on progress dates for the stats
rewrite. Offline-only builds no longer queue sync rows that nothing
drains, and clear the backlog once. A malformed JSON column now loses
that field instead of failing the whole habit list."
```

---

### Task 2: Batched stats and the daylight-saving fix

**Files:**
- Modify: `src/utils/helpers/habits.ts`
- Modify: `src/services/core/DataService.ts`
- Modify: `.github/workflows/ci.yml`
- Test: `tests/dailyStats.test.ts` (create)

**Interfaces:**
- Consumes: `offlineStorage.getProgressInRange(userId, start, end)` and `offlineStorage.getAllHabitProgress(userId)` (Task 1).
- Produces: `parseDayKey(value: string): Date | null` and `addDays(d: Date, n: number): Date`, exported from `src/utils/helpers/habits.ts`. `dataService.getDailyStats` and `dataService.getHabitsWithStats` keep their signatures.

- [ ] **Step 1: Write the failing tests**

Create `tests/dailyStats.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `TZ=Europe/London npx jest tests/dailyStats.test.ts`

Expected: these fail:
- "walks every calendar day once": `2027-03-28` appears twice and `2027-04-01` is missing;
- "counts done habits": `getProgressInRange` called 0 times;
- "loads every habit's progress": `getHabitProgress` was called.

- [ ] **Step 3: Implement**

In `src/utils/helpers/habits.ts`, export the two existing helpers by changing:

```ts
const parseDayKey = (value: string): Date | null => {
```

to:

```ts
export const parseDayKey = (value: string): Date | null => {
```

and:

```ts
const addDays = (d: Date, n: number): Date =>
```

to:

```ts
export const addDays = (d: Date, n: number): Date =>
```

In `src/services/core/DataService.ts`, change the import on line 14:

```ts
import { calculateHabitStats, HabitStats } from "../../utils/helpers/habits";
```

to:

```ts
import {
  addDays,
  calculateHabitStats,
  HabitStats,
  parseDayKey,
} from "../../utils/helpers/habits";
import { toLocalISODate } from "../../utils/formatting/time";
```

In `getHabitsWithStats()`, replace:

```ts
    for (const habit of habits) {
      const stats = await this.calculateHabitStats(habit);
      habitsWithStats.push({
        ...habit,
        ...stats,
      });
    }
```

with:

```ts
    // One query for every habit's history, grouped here. This used to run a
    // full-history query per habit, on every screen that shows stats.
    const allProgress = await offlineStorage.getAllHabitProgress(
      this.currentUserId
    );
    const progressByHabit = new Map<string, HabitProgress[]>();
    for (const entry of allProgress) {
      const list = progressByHabit.get(entry.habitId);
      if (list) list.push(entry);
      else progressByHabit.set(entry.habitId, [entry]);
    }

    for (const habit of habits) {
      const stats = calculateHabitStats(progressByHabit.get(habit.id) ?? [], {
        createdAt: habit.createdAt,
        frequency: habit.frequency,
      });
      habitsWithStats.push({
        ...habit,
        ...stats,
      });
    }
```

Replace the whole `getDailyStats` method, from `async getDailyStats(` through its closing `}` just above `// ===== SYNC OPERATIONS =====`, with:

```ts
  async getDailyStats(
    startDate: string,
    endDate: string
  ): Promise<DailyStats[]> {
    const start = parseDayKey(startDate);
    const end = parseDayKey(endDate);
    if (!start || !end) return [];

    // Deleted habits still count on the days they existed, so historical
    // charts don't change when a habit is removed.
    const habits = await this.getAllHabitsIncludingDeleted();

    // One query for the whole range. This used to run one query per habit
    // per day, which for a year of history meant thousands of round trips.
    const progress = await offlineStorage.getProgressInRange(
      this.currentUserId,
      startDate,
      endDate
    );
    const doneByDate = new Map<string, Set<string>>();
    for (const entry of progress) {
      if (entry.status !== "done") continue;
      const done = doneByDate.get(entry.date) ?? new Set<string>();
      done.add(entry.habitId);
      doneByDate.set(entry.date, done);
    }

    const dailyStats: DailyStats[] = [];
    // Walk local calendar days. Walking UTC midnights repeated a day and
    // dropped the last one whenever a range crossed a spring clock change
    // in a zone at or just east of UTC (e.g. the UK).
    for (let day = start; day <= end; day = addDays(day, 1)) {
      const dateString = toLocalISODate(day);
      const done = doneByDate.get(dateString);

      let completedHabits = 0;
      let totalActiveHabits = 0;

      for (const habit of habits) {
        // Check if habit was active on this date
        const habitCreatedDate = habit.createdAt
          ? habit.createdAt.split("T")[0]
          : "1900-01-01";
        const habitDeletedDate = habit.deletedAt
          ? habit.deletedAt.split("T")[0]
          : null;

        const wasActive =
          dateString >= habitCreatedDate &&
          (!habitDeletedDate || dateString <= habitDeletedDate);
        if (!wasActive) continue;

        totalActiveHabits++;
        if (done?.has(habit.id)) completedHabits++;
      }

      dailyStats.push({
        date: dateString,
        totalHabits: totalActiveHabits,
        completedHabits,
        completionRate:
          totalActiveHabits > 0
            ? Math.round((completedHabits / totalActiveHabits) * 100)
            : 0,
      });
    }

    return dailyStats;
  }
```

In `.github/workflows/ci.yml`, add this step directly after the `Test (UTC+13)` step:

```yaml
      # The calendar walk once repeated a day across the spring clock change.
      # That only shows in zones whose clocks sit at or just past UTC and
      # observe DST, which none of the zones above do.
      - name: Test (Europe/London)
        run: npx jest --ci
        env:
          TZ: Europe/London
```

- [ ] **Step 4: Run the tests to verify they pass, in every CI timezone**

Run: `for tz in UTC America/Los_Angeles Pacific/Auckland Europe/London; do TZ=$tz npx jest --ci tests/dailyStats.test.ts tests/DataService.test.ts tests/habitStats.test.ts || echo "FAILED in $tz"; done`

Expected: every run passes, and no `FAILED` line is printed.

- [ ] **Step 5: Type-check and run the whole suite**

Run: `npx tsc --noEmit && TZ=Europe/London npx jest --ci`

Expected: exit 0; all pass.

- [ ] **Step 6: Commit**

```bash
git add src/utils/helpers/habits.ts src/services/core/DataService.ts .github/workflows/ci.yml tests/dailyStats.test.ts
git commit -m "Compute stats from one query and walk local calendar days

Analytics, the calendar and achievement checks ran one SQLite query per
habit per day, so the app slowed down as history grew. Stats now come
from a single range or full-history query grouped in memory.

The daily walk also stepped through UTC midnights, which in the UK
repeated 28 March and dropped the last day of any range across the
spring clock change. It now walks local days, and CI runs the suite
under Europe/London to keep it that way."
```

---

### Task 3: Feedback config and the rating prompt

**Files:**
- Create: `src/config/feedback.ts`
- Create: `src/services/feedback/ReviewPromptService.ts`
- Test: `tests/ReviewPromptService.test.ts` (create)

**Interfaces:**
- Produces from `src/config/feedback.ts`:
  - `FEEDBACK_API: { url: string; publishableKey: string; timeoutMs: number }`
  - `STORE_REVIEW_URL: { ios: { primary: string; fallback: string | null }; android: { primary: string; fallback: string | null } }`
- Produces from `src/services/feedback/ReviewPromptService.ts`:
  - `interface ReviewTriggerStats { currentStreak: number; totalCompletions: number }`
  - `reviewPromptService.recordFirstOpen(now?: number): Promise<void>`
  - `reviewPromptService.recordCrash(now?: number): Promise<void>`
  - `reviewPromptService.isMilestone(stats: ReviewTriggerStats): boolean`
  - `reviewPromptService.maybePrompt(stats: ReviewTriggerStats, now?: number): Promise<boolean>`
  - `reviewPromptService.openStorePage(): Promise<void>`

- [ ] **Step 1: Write the failing tests**

Create `tests/ReviewPromptService.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/ReviewPromptService.test.ts`

Expected: FAIL with `Cannot find module '../src/services/feedback/ReviewPromptService'`.

- [ ] **Step 3: Implement**

Create `src/config/feedback.ts`:

```ts
// Public by design: the publishable key ships inside every build and can only
// call submit_feedback() and ping() (see supabase/migrations). These are
// constants rather than env vars because EAS builds don't upload the
// gitignored .env files.
export const FEEDBACK_API = {
  url: 'https://abpyvxtteulfyhprmaad.supabase.co/rest/v1/rpc/submit_feedback',
  publishableKey: 'sb_publishable_nICy1-CokF8dhTEUIBiJEQ_RbEmtOdD',
  timeoutMs: 10_000,
};

export const STORE_REVIEW_URL: Record<
  'ios' | 'android',
  { primary: string; fallback: string | null }
> = {
  ios: {
    primary: 'https://apps.apple.com/app/id6751805707?action=write-review',
    fallback: null,
  },
  android: {
    primary: 'market://details?id=com.biszaal.itrackhabit',
    fallback: 'https://play.google.com/store/apps/details?id=com.biszaal.itrackhabit',
  },
};
```

Create `src/services/feedback/ReviewPromptService.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/ReviewPromptService.test.ts && npx tsc --noEmit`

Expected: all pass; tsc exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/config/feedback.ts src/services/feedback/ReviewPromptService.ts tests/ReviewPromptService.test.ts
git commit -m "Add a rating prompt that only asks at good moments

The prompt fires on a 7, 30 or 100-day streak or a 25th completion,
and only once the app is three days old, 120 days after the last ask,
and a week clear of any crash. The feedback config holds the public
endpoint and store URLs the feedback work builds on."
```

---

### Task 4: Check-ins return immediately

**Files:**
- Modify: `src/services/core/DataService.ts`
- Test: `tests/checkInBackground.test.ts` (create)

**Interfaces:**
- Consumes: `reviewPromptService.maybePrompt(stats)` (Task 3); `achievementService.initialize()` and `achievementService.checkForNewAchievements()` (existing).
- Produces: `dataService.afterCompletionIdle(): Promise<void>`, which resolves once queued after-completion work finishes. Tests use it.

- [ ] **Step 1: Write the failing tests**

Create `tests/checkInBackground.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/checkInBackground.test.ts`

Expected: FAIL with `dataService.afterCompletionIdle is not a function`.

- [ ] **Step 3: Implement**

In `src/services/core/DataService.ts`:

Delete the import line:

```ts
import { socialService } from "../social/SocialService";
```

Add, below the `achievementService` import:

```ts
import { reviewPromptService } from "../feedback/ReviewPromptService";
```

Add a field directly after `private syncInterval: any = null;`:

```ts
  private afterCompletionChain: Promise<void> = Promise.resolve();
```

In `markHabitProgress`, replace the whole block:

```ts
    // Check for new achievements when habit is completed
    if (progress.status === "done") {
      try {
        await achievementService.initialize();
        await achievementService.checkForNewAchievements();

        // Track social activity for habit completion
        const habit = await offlineStorage.getHabit(habitId);
        if (habit) {
          await socialService.initialize();
          await socialService.trackHabitCompletion(habitId, habit.title);
        }
      } catch (error) {
        console.error("Achievement check or social tracking failed:", error);
      }
    }
```

with:

```ts
    // Achievements and the rating prompt used to run here, awaited, so every
    // tap waited on them. The social-feed write that sat alongside belonged
    // to a feature that no longer exists and is gone.
    if (progress.status === "done") {
      this.queueAfterCompletion(habitId);
    }
```

Add these methods directly after the end of `markHabitProgress` (before `private async syncProgressWithRealTimeUpdate`):

```ts
  /**
   * Runs post-completion work in the background, one job at a time, so
   * overlapping taps never race each other for the same achievement or
   * rating prompt.
   */
  private queueAfterCompletion(habitId: string): void {
    this.afterCompletionChain = this.afterCompletionChain.then(() =>
      this.runAfterCompletion(habitId)
    );
  }

  private async runAfterCompletion(habitId: string): Promise<void> {
    try {
      await achievementService.initialize();
      await achievementService.checkForNewAchievements();
    } catch (error) {
      console.error("Achievement check failed:", error);
    }

    try {
      const habit = await offlineStorage.getHabit(habitId);
      if (!habit) return;
      const stats = await this.calculateHabitStats(habit);
      await reviewPromptService.maybePrompt(stats);
    } catch (error) {
      console.error("Review prompt check failed:", error);
    }
  }

  /** Resolves once queued after-completion work has finished. */
  afterCompletionIdle(): Promise<void> {
    return this.afterCompletionChain;
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/checkInBackground.test.ts && npx tsc --noEmit && npx eslint src/ tests/ --quiet`

Expected: 5 passed; tsc and eslint exit 0. If eslint flags `socialService` as unused anywhere, the import was not fully removed.

- [ ] **Step 5: Run the whole suite**

Run: `TZ=UTC npx jest --ci`

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/services/core/DataService.ts tests/checkInBackground.test.ts
git commit -m "Return from a check-in before achievement work runs

Every tap waited on an achievement check and a write to the activity
feed of the removed social feature, each reloading every habit's full
history. The feed write is gone; achievements and the new rating
prompt now run afterwards, one job at a time."
```

---

### Task 5: FeedbackService

**Files:**
- Create: `src/services/feedback/FeedbackService.ts`
- Test: `tests/FeedbackService.test.ts` (create)

**Interfaces:**
- Consumes: `FEEDBACK_API` from `src/config/feedback.ts` (Task 3).
- Produces from `src/services/feedback/FeedbackService.ts`:
  - `type FeedbackCategory = 'bug' | 'idea' | 'confusing' | 'praise'`
  - `type FeedbackSource = 'profile' | 'crash_screen'`
  - `interface FeedbackInput { category: FeedbackCategory; message: string; contactEmail?: string; includeDeviceInfo: boolean; source: FeedbackSource }`
  - `interface DeviceInfo { appVersion: string; platform: 'ios' | 'android'; osVersion: string; deviceModel: string | null }`
  - `type SubmitOutcome = { status: 'sent' } | { status: 'queued' } | { status: 'rate_limited' } | { status: 'invalid'; message: string }`
  - `const MAX_MESSAGE_LENGTH = 4000`, `const EMAIL_PATTERN: RegExp`
  - `feedbackService.getDeviceInfo(): DeviceInfo`
  - `feedbackService.submit(input: FeedbackInput): Promise<SubmitOutcome>`
  - `feedbackService.flushOutbox(): Promise<void>`

- [ ] **Step 1: Write the failing tests**

Create `tests/FeedbackService.test.ts`:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FEEDBACK_API } from "../src/config/feedback";
import { feedbackService, FeedbackInput } from "../src/services/feedback/FeedbackService";

jest.mock("expo-application", () => ({ nativeBuildVersion: "31" }));
jest.mock("expo-device", () => ({ modelName: "Galaxy S26 Ultra" }));
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.1.0" } },
}));

const DAY = 24 * 60 * 60 * 1000;
const store: Record<string, string> = {};
const fetchMock = jest.fn();

const reply = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});
const outbox = () => JSON.parse(store.feedback_outbox ?? "[]");
const bodyOf = (call: number) => JSON.parse(fetchMock.mock.calls[call][1].body);

const input: FeedbackInput = {
  category: "idea",
  message: "  More colours please  ",
  includeDeviceInfo: true,
  source: "profile",
};

beforeEach(() => {
  for (const key of Object.keys(store)) delete store[key];
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (k: string) => store[k] ?? null);
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (k: string, v: string) => {
    store[k] = v;
  });
  fetchMock.mockReset();
  (global as any).fetch = fetchMock;
});

afterEach(() => jest.useRealTimers());

describe("FeedbackService.submit", () => {
  it("posts the trimmed message with device info to the feedback function", async () => {
    fetchMock.mockResolvedValue(reply(200, "id"));

    expect(await feedbackService.submit(input)).toEqual({ status: "sent" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(FEEDBACK_API.url);
    expect(init.method).toBe("POST");
    expect(init.headers.apikey).toBe(FEEDBACK_API.publishableKey);
    expect(bodyOf(0)).toEqual({
      p_category: "idea",
      p_message: "More colours please",
      p_install_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      p_source: "profile",
      p_contact_email: null,
      p_app_version: "1.1.0 (31)",
      p_platform: "ios",
      p_os_version: expect.any(String),
      p_device_model: "Galaxy S26 Ultra",
    });
  });

  it("reuses one install id across messages", async () => {
    fetchMock.mockResolvedValue(reply(200, "id"));
    await feedbackService.submit(input);
    await feedbackService.submit(input);
    expect(bodyOf(0).p_install_id).toBe(bodyOf(1).p_install_id);
  });

  it("leaves device info out when switched off, and sends a trimmed email", async () => {
    fetchMock.mockResolvedValue(reply(200, "id"));
    await feedbackService.submit({ ...input, includeDeviceInfo: false, contactEmail: " me@example.com " });
    expect(bodyOf(0)).toMatchObject({
      p_contact_email: "me@example.com",
      p_app_version: null,
      p_platform: null,
      p_os_version: null,
      p_device_model: null,
    });
  });

  it("truncates on whole characters, not UTF-16 halves", async () => {
    fetchMock.mockResolvedValue(reply(200, "id"));
    await feedbackService.submit({ ...input, message: "😀".repeat(4001) });
    const sent: string = bodyOf(0).p_message;
    expect(Array.from(sent)).toHaveLength(4000);
    expect(/[\ud800-\udbff](?![\udc00-\udfff])/.test(sent)).toBe(false);
  });

  it.each([
    ["a network error", () => fetchMock.mockRejectedValue(new TypeError("Network request failed"))],
    ["a server error", () => fetchMock.mockResolvedValue(reply(503, {}))],
    ["the global rate limit", () => fetchMock.mockResolvedValue(reply(400, { message: "rate_limited_global" }))],
  ])("queues the message after %s", async (_label, arrange) => {
    arrange();
    expect(await feedbackService.submit(input)).toEqual({ status: "queued" });
    expect(outbox()).toHaveLength(1);
    expect(outbox()[0].notBefore).toBe(0);
  });

  it("queues for tomorrow when this install hit its daily limit", async () => {
    const now = Date.UTC(2026, 9, 24);
    jest.spyOn(Date, "now").mockReturnValue(now);
    fetchMock.mockResolvedValue(reply(400, { message: "rate_limited_install" }));

    expect(await feedbackService.submit(input)).toEqual({ status: "rate_limited" });
    expect(outbox()[0].notBefore).toBe(now + DAY);
    jest.restoreAllMocks();
  });

  it("reports a validation error and does not queue it", async () => {
    fetchMock.mockResolvedValue(reply(400, { message: "invalid email" }));
    expect(await feedbackService.submit(input)).toEqual({ status: "invalid", message: "invalid email" });
    expect(outbox()).toHaveLength(0);
  });

  it("gives up waiting after the timeout and queues", async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => reject(new Error("aborted")));
        })
    );

    const pending = feedbackService.submit(input);
    await jest.advanceTimersByTimeAsync(FEEDBACK_API.timeoutMs);

    expect(await pending).toEqual({ status: "queued" });
  });

  it("keeps at most 20 queued messages, dropping the oldest", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network request failed"));
    for (let i = 0; i < 25; i++) {
      await feedbackService.submit({ ...input, message: `msg ${i}` });
    }
    expect(outbox()).toHaveLength(20);
    expect(outbox()[0].payload.p_message).toBe("msg 5");
  });
});

describe("FeedbackService.flushOutbox", () => {
  it("sends feedback left in the outbox by an earlier run", async () => {
    store.feedback_outbox = JSON.stringify([
      { id: "a", notBefore: 0, payload: { p_category: "bug", p_message: "from yesterday" } },
    ]);
    fetchMock.mockResolvedValue(reply(200, "id"));

    await feedbackService.flushOutbox();

    expect(bodyOf(0).p_message).toBe("from yesterday");
    expect(outbox()).toHaveLength(0);
  });

  it("keeps what still fails and drops what the server rejects", async () => {
    store.feedback_outbox = JSON.stringify([
      { id: "a", notBefore: 0, payload: { p_message: "offline still" } },
      { id: "b", notBefore: 0, payload: { p_message: "bad one" } },
    ]);
    fetchMock
      .mockRejectedValueOnce(new TypeError("Network request failed"))
      .mockResolvedValueOnce(reply(400, { message: "invalid category" }));

    await feedbackService.flushOutbox();

    expect(outbox().map((i: { id: string }) => i.id)).toEqual(["a"]);
  });

  it("leaves messages alone until their wait is over", async () => {
    store.feedback_outbox = JSON.stringify([
      { id: "a", notBefore: Date.now() + DAY, payload: { p_message: "tomorrow" } },
    ]);
    await feedbackService.flushOutbox();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(outbox()).toHaveLength(1);
  });

  it("keeps a message queued while a flush is running", async () => {
    let release!: (value: unknown) => void;
    store.feedback_outbox = JSON.stringify([
      { id: "a", notBefore: 0, payload: { p_message: "first" } },
    ]);
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));

    const flushing = feedbackService.flushOutbox();
    // Let the flush reach its network call before the new message is sent,
    // so the two requests take the mocked responses in a known order.
    while (fetchMock.mock.calls.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    fetchMock.mockRejectedValueOnce(new TypeError("Network request failed"));
    await feedbackService.submit({ ...input, message: "during flush" });
    release(reply(200, "id"));
    await flushing;

    expect(outbox().map((i: { payload: { p_message: string } }) => i.payload.p_message)).toEqual(["during flush"]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/FeedbackService.test.ts`

Expected: FAIL with `Cannot find module '../src/services/feedback/FeedbackService'`.

- [ ] **Step 3: Implement**

Create `src/services/feedback/FeedbackService.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/FeedbackService.test.ts && npx tsc --noEmit`

Expected: all pass; tsc exits 0.

If the timeout test fails with `AbortController is not defined`, the test environment lacks it. Add this line at the top of `tests/setup.js`, then rerun:

```js
global.AbortController = global.AbortController || require("abort-controller");
```

Do **not** change the service; React Native provides `AbortController` at runtime.

- [ ] **Step 5: Commit**

```bash
git add src/services/feedback/FeedbackService.ts tests/FeedbackService.test.ts
git commit -m "Send feedback to the Supabase inbox, with an offline outbox

Messages go to submit_feedback with an install id that exists only to
rate limit. Anything that cannot be sent now waits in an on-device
outbox of at most 20; messages over this install's daily limit wait a
day, and messages the server rejects as invalid are reported, not
retried."
```

---

### Task 6: Feedback screen, route and Profile rows

**Files:**
- Modify: `src/components/ds/Field.tsx`
- Create: `src/screens/settings/FeedbackScreen.tsx`
- Modify: `src/types/navigation.ts`, `src/navigation/index.tsx`
- Modify: `src/screens/settings/ProfileScreen.tsx`
- Test: `tests/FeedbackScreen.test.tsx` (create)

**Interfaces:**
- Consumes: `feedbackService`, `FeedbackCategory`, `SubmitOutcome`, `MAX_MESSAGE_LENGTH` and `EMAIL_PATTERN` (Task 5); `reviewPromptService.openStorePage()` (Task 3).
- Produces: the stack route `Feedback: undefined`, and `export const FeedbackScreen: React.FC<RootStackScreenProps<'Feedback'>>`.

- [ ] **Step 1: Write the failing tests**

Create `tests/FeedbackScreen.test.tsx`:

```tsx
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FeedbackScreen } from "../src/screens/settings/FeedbackScreen";

const mockSubmit = jest.fn();

jest.mock("expo-application", () => ({ nativeBuildVersion: "31" }));
jest.mock("expo-device", () => ({ modelName: "iPhone 17" }));

jest.mock("../src/services/feedback/FeedbackService", () => {
  const actual = jest.requireActual("../src/services/feedback/FeedbackService");
  return {
    ...actual,
    feedbackService: {
      submit: (...args: unknown[]) => mockSubmit(...args),
      flushOutbox: jest.fn().mockResolvedValue(undefined),
      getDeviceInfo: () => ({ appVersion: "1.1.0 (31)", platform: "ios", osVersion: "26.0", deviceModel: "iPhone 17" }),
    },
  };
});

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <FeedbackScreen navigation={{ goBack: jest.fn() } as any} route={{ key: "Feedback", name: "Feedback" } as any} />
    </SafeAreaProvider>
  );

const fillIn = (screen: ReturnType<typeof renderScreen>, message = "More colours") => {
  fireEvent.press(screen.getByRole("button", { name: "I have an idea" }));
  fireEvent.changeText(screen.getByPlaceholderText("What's on your mind?"), message);
};

const sendButton = (screen: ReturnType<typeof renderScreen>) =>
  screen.getByRole("button", { name: "Send feedback" });

beforeEach(() => mockSubmit.mockReset());

describe("FeedbackScreen", () => {
  it("keeps Send disabled until a category and a message are given", () => {
    const screen = renderScreen();
    expect(sendButton(screen)).toBeDisabled();
    fireEvent.press(screen.getByRole("button", { name: "I have an idea" }));
    expect(sendButton(screen)).toBeDisabled();
    fireEvent.changeText(screen.getByPlaceholderText("What's on your mind?"), "More colours");
    expect(sendButton(screen)).not.toBeDisabled();
  });

  it("sends the feedback and thanks the user", async () => {
    mockSubmit.mockResolvedValue({ status: "sent" });
    const screen = renderScreen();
    fillIn(screen);
    fireEvent.press(sendButton(screen));

    await screen.findByText("Thank you — we read every message.");
    expect(mockSubmit).toHaveBeenCalledWith({
      category: "idea",
      message: "More colours",
      contactEmail: undefined,
      includeDeviceInfo: true,
      source: "profile",
    });
    expect(screen.getByPlaceholderText("What's on your mind?").props.value).toBe("");
  });

  it("shows the device details it will send, and leaves them out when switched off", async () => {
    mockSubmit.mockResolvedValue({ status: "sent" });
    const screen = renderScreen();
    expect(screen.getByText("1.1.0 (31) · ios 26.0 · iPhone 17")).toBeTruthy();

    fireEvent(screen.getByLabelText("Include device info"), "valueChange", false);
    fillIn(screen);
    fireEvent.press(sendButton(screen));

    await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
    expect(mockSubmit.mock.calls[0][0].includeDeviceInfo).toBe(false);
  });

  it("blocks a malformed email", () => {
    const screen = renderScreen();
    fillIn(screen);
    fireEvent.changeText(screen.getByPlaceholderText("Only if you'd like a reply"), "abc");
    expect(screen.getByText("That email doesn't look right.")).toBeTruthy();
    expect(sendButton(screen)).toBeDisabled();
  });

  it("sends once when Send is tapped twice", async () => {
    mockSubmit.mockReturnValue(new Promise(() => {}));
    const screen = renderScreen();
    fillIn(screen);
    const button = sendButton(screen);
    fireEvent.press(button);
    fireEvent.press(button);
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it("tells the user an offline message will send later", async () => {
    mockSubmit.mockResolvedValue({ status: "queued" });
    const screen = renderScreen();
    fillIn(screen);
    fireEvent.press(sendButton(screen));
    await screen.findByText("Saved. It'll send automatically when you're back online.");
  });

  it("tells the user when today's limit is reached", async () => {
    mockSubmit.mockResolvedValue({ status: "rate_limited" });
    const screen = renderScreen();
    fillIn(screen);
    fireEvent.press(sendButton(screen));
    await screen.findByText("Thanks for all the feedback today! This one will send tomorrow.");
  });

  it("shows the server's reason when the message is rejected, and keeps the text", async () => {
    mockSubmit.mockResolvedValue({ status: "invalid", message: "invalid email" });
    const screen = renderScreen();
    fillIn(screen, "Keep me");
    fireEvent.press(sendButton(screen));
    await screen.findByText("Couldn't send: invalid email");
    expect(screen.getByPlaceholderText("What's on your mind?").props.value).toBe("Keep me");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/FeedbackScreen.test.tsx`

Expected: FAIL with `Cannot find module '../src/screens/settings/FeedbackScreen'`.

- [ ] **Step 3: Teach `Field` to be multiline**

In `src/components/ds/Field.tsx`, in the inner `<View style={{ ... }}>`, replace:

```tsx
          height: 52,
```

and

```tsx
          alignItems: 'center',
```

with a single spread at the top of that style object:

```tsx
          // A multiline field grows with its text instead of clipping to one row.
          ...(rest.multiline
            ? { minHeight: 132, paddingVertical: 14, alignItems: 'flex-start' as const }
            : { height: 52, alignItems: 'center' as const }),
```

In the same file, add `textAlignVertical` to the `TextInput`'s first style object:

```tsx
            {
              flex: 1,
              color: t.colors.ink,
              fontSize: 16,
              padding: 0,
              textAlignVertical: rest.multiline ? 'top' : 'center',
            },
```

- [ ] **Step 4: Create the screen**

Create `src/screens/settings/FeedbackScreen.tsx`:

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { RootStackScreenProps } from '../../types/navigation';
import { useTheme } from '../../theme/ThemeContext';
import { Screen, AppHeader, Card, Chip, Field, Button } from '../../components/ds';
import {
  feedbackService,
  FeedbackCategory,
  SubmitOutcome,
  MAX_MESSAGE_LENGTH,
  EMAIL_PATTERN,
} from '../../services/feedback/FeedbackService';

type Props = RootStackScreenProps<'Feedback'>;

const CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: 'bug', label: "Something's broken" },
  { value: 'idea', label: 'I have an idea' },
  { value: 'confusing', label: "Something's confusing" },
  { value: 'praise', label: 'I love something' },
];

const RESULT_TEXT: Record<Exclude<SubmitOutcome['status'], 'invalid'>, string> = {
  sent: 'Thank you — we read every message.',
  queued: "Saved. It'll send automatically when you're back online.",
  rate_limited: 'Thanks for all the feedback today! This one will send tomorrow.',
};

export const FeedbackScreen: React.FC<Props> = ({ navigation }) => {
  const t = useTheme();
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [includeDevice, setIncludeDevice] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // State updates land after the next render, so a quick double tap would
  // otherwise get past a `sending` check and submit twice.
  const sendingRef = useRef(false);

  useEffect(() => {
    feedbackService.flushOutbox().catch(() => {});
  }, []);

  const device = feedbackService.getDeviceInfo();
  const deviceLine = `${device.appVersion} · ${device.platform} ${device.osVersion} · ${device.deviceModel ?? 'Unknown device'}`;
  const trimmedEmail = email.trim();
  const emailInvalid = trimmedEmail.length > 0 && !EMAIL_PATTERN.test(trimmedEmail);
  const canSend = category !== null && message.trim().length > 0 && !emailInvalid;

  const send = async () => {
    if (!category || !canSend || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const outcome = await feedbackService.submit({
        category,
        message,
        contactEmail: trimmedEmail || undefined,
        includeDeviceInfo: includeDevice,
        source: 'profile',
      });
      if (outcome.status === 'invalid') {
        setError(`Couldn't send: ${outcome.message}`);
        return;
      }
      setResult(RESULT_TEXT[outcome.status]);
      setCategory(null);
      setMessage('');
      setEmail('');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Send feedback" back onBack={() => navigation.goBack()} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: t.spacing.screen, paddingBottom: 48, gap: 18 }}
      >
        {result && (
          <Card variant="elevated" padding={16}>
            <Text style={{ color: t.colors.ink, fontSize: 15, fontWeight: '600' }}>{result}</Text>
          </Card>
        )}

        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: t.colors.ink3, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            What's this about?
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((c) => (
              <Chip key={c.value} label={c.label} active={category === c.value} onPress={() => setCategory(c.value)} />
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Field
            label="Message"
            placeholder="What's on your mind?"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <Text style={{ color: t.colors.ink4, fontSize: 11, textAlign: 'right' }}>
            {message.length}/{MAX_MESSAGE_LENGTH}
          </Text>
        </View>

        <View style={{ gap: 6 }}>
          <Field
            label="Email (optional)"
            placeholder="Only if you'd like a reply"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {emailInvalid && (
            <Text style={{ color: t.colors.danger, fontSize: 12 }}>That email doesn't look right.</Text>
          )}
        </View>

        <Card variant="elevated" padding={16} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: t.colors.ink, fontSize: 15 }}>Include device info</Text>
            <Switch
              value={includeDevice}
              onValueChange={setIncludeDevice}
              accessibilityLabel="Include device info"
            />
          </View>
          {includeDevice && <Text style={{ color: t.colors.ink3, fontSize: 12 }}>{deviceLine}</Text>}
        </Card>

        <Text style={{ color: t.colors.ink3, fontSize: 12, lineHeight: 17 }}>
          This sends only what you see here. Your habits stay on your device.
        </Text>

        {error && <Text style={{ color: t.colors.danger, fontSize: 13 }}>{error}</Text>}

        <Button title="Send feedback" onPress={send} disabled={!canSend} loading={sending} fullWidth />
      </ScrollView>
    </Screen>
  );
};

export default FeedbackScreen;
```

- [ ] **Step 5: Register the route and add the Profile rows**

In `src/types/navigation.ts`, add to `RootStackParamList`, directly after `DeveloperTools: undefined;`:

```ts
  Feedback: undefined;
```

In `src/navigation/index.tsx`, add the import after the `DeveloperToolsScreen` import:

```ts
import { FeedbackScreen } from '../screens/settings/FeedbackScreen';
```

Then add this screen directly after the `PrivacySecurity` `<Stack.Screen ... />`:

```tsx
        <Stack.Screen
          name="Feedback"
          component={FeedbackScreen}
          options={{
            title: 'Send feedback',
            headerShown: false,
          }}
        />
```

In `src/screens/settings/ProfileScreen.tsx`, add the import:

```ts
import { reviewPromptService } from '../../services/feedback/ReviewPromptService';
```

In the `'Support'` group, add two rows before the `About iTrackHabit` row:

```ts
        { icon: 'chat', accent: t.colors.primary, label: 'Send feedback', onPress: () => navigation.navigate('Feedback') },
        {
          icon: 'medal',
          accent: t.colors.amber,
          label: 'Rate iTrackHabit',
          onPress: () => {
            reviewPromptService.openStorePage().catch(() => {
              Alert.alert('Could not open the store', 'Please try again later.');
            });
          },
        },
```

`Alert` is already imported in `ProfileScreen.tsx`.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx jest tests/FeedbackScreen.test.tsx && npx tsc --noEmit && npx eslint src/ tests/ --quiet`

Expected: 8 passed; tsc and eslint exit 0.

- [ ] **Step 7: Run the whole suite**

Run: `TZ=UTC npx jest --ci`

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/ds/Field.tsx src/screens/settings/FeedbackScreen.tsx src/types/navigation.ts src/navigation/index.tsx src/screens/settings/ProfileScreen.tsx tests/FeedbackScreen.test.tsx
git commit -m "Add a Send feedback screen and a Rate iTrackHabit row

Profile now opens a form with a category, a message, an optional
reply email and a device-info switch that shows exactly what will be
sent. A double tap sends once. Field gains a multiline layout for the
message box."
```

---

### Task 7: Crash screen and app wiring

**Files:**
- Create: `src/components/ErrorBoundary.tsx`
- Modify: `App.tsx`
- Modify: `src/screens/settings/DeveloperToolsScreen.tsx`
- Test: `tests/ErrorBoundary.test.tsx` (create)

**Interfaces:**
- Consumes:
  - `feedbackService.submit(...)` and `feedbackService.getDeviceInfo()` (Task 5);
  - `reviewPromptService.recordCrash()` and `reviewPromptService.recordFirstOpen()` (Task 3);
  - `feedbackService.flushOutbox()` (Task 5);
  - `dataExportService.exportAllData(): Promise<{ success: boolean; filePath?: string; error?: string }>` (existing).
- Produces:
  - `export class ErrorBoundary extends React.Component<{ children: React.ReactNode }>`
  - `export const buildCrashReport(error: Error, componentStack: string): string`

- [ ] **Step 1: Write the failing tests**

Create `tests/ErrorBoundary.test.tsx`:

```tsx
import React from "react";
import { Text } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary, buildCrashReport } from "../src/components/ErrorBoundary";
import { feedbackService } from "../src/services/feedback/FeedbackService";
import { reviewPromptService } from "../src/services/feedback/ReviewPromptService";
import { dataExportService } from "../src/services/core/DataExportService";

jest.mock("../src/services/feedback/FeedbackService", () => ({
  feedbackService: {
    submit: jest.fn(),
    getDeviceInfo: () => ({ appVersion: "1.1.0 (31)", platform: "ios", osVersion: "26.0", deviceModel: "iPhone 17" }),
  },
}));
jest.mock("../src/services/feedback/ReviewPromptService", () => ({
  reviewPromptService: { recordCrash: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock("../src/services/core/DataExportService", () => ({
  dataExportService: { exportAllData: jest.fn() },
}));

const submit = feedbackService.submit as jest.Mock;
const recordCrash = reviewPromptService.recordCrash as jest.Mock;
const exportAllData = dataExportService.exportAllData as jest.Mock;

let shouldThrow = true;
const Boom = () => {
  if (shouldThrow) throw new Error("Kaboom");
  return <Text>Child OK</Text>;
};

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderBoundary = () =>
  render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    </SafeAreaProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  shouldThrow = true;
});

describe("ErrorBoundary", () => {
  it("shows the crash screen and records the crash", async () => {
    const screen = renderBoundary();
    expect(screen.getByText("Something went wrong.")).toBeTruthy();
    expect(screen.getByText("Your habits are safe on this device.")).toBeTruthy();
    await waitFor(() => expect(recordCrash).toHaveBeenCalled());
  });

  it("remounts the app on Try again", () => {
    const screen = renderBoundary();
    shouldThrow = false;
    fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText("Child OK")).toBeTruthy();
  });

  it("shows the report before sending it as a bug from the crash screen", async () => {
    submit.mockResolvedValue({ status: "sent" });
    const screen = renderBoundary();

    fireEvent.press(screen.getByRole("button", { name: "Send error report" }));
    expect(screen.getByText(/^Error: Kaboom/)).toBeTruthy();
    expect(submit).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole("button", { name: "Send report" }));
    await screen.findByText("Report sent. Thank you.");
    expect(submit).toHaveBeenCalledWith({
      category: "bug",
      message: expect.stringMatching(/^Error: Kaboom/),
      includeDeviceInfo: true,
      source: "crash_screen",
    });
  });

  it("reports an export failure without crashing", async () => {
    exportAllData.mockRejectedValue(new Error("disk full"));
    const screen = renderBoundary();
    fireEvent.press(screen.getByRole("button", { name: "Export my data" }));
    await screen.findByText("Couldn't export. Your data is still on this device.");
  });
});

describe("buildCrashReport", () => {
  it("keeps the error line and caps the component stack at 1,500 characters", () => {
    const report = buildCrashReport(new TypeError("x is undefined"), "  " + "a".repeat(2000));
    expect(report.startsWith("TypeError: x is undefined\n\n")).toBe(true);
    expect(report.length).toBe("TypeError: x is undefined\n\n".length + 1500);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/ErrorBoundary.test.tsx`

Expected: FAIL with `Cannot find module '../src/components/ErrorBoundary'`.

- [ ] **Step 3: Create the error boundary**

Create `src/components/ErrorBoundary.tsx`:

```tsx
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Fixed light palette: this screen sits outside ThemeProvider so that it
// still renders when theming is what broke.
import { lightPalette as c } from '../theme/tokens';
import { feedbackService } from '../services/feedback/FeedbackService';
import { reviewPromptService } from '../services/feedback/ReviewPromptService';
import { dataExportService } from '../services/core/DataExportService';

const STACK_LIMIT = 1500;
const EXPORT_FAILED = "Couldn't export. Your data is still on this device.";

/** The exact text a crash report sends. It is shown to the user first. */
export const buildCrashReport = (error: Error, componentStack: string): string =>
  `${error.name}: ${error.message}\n\n${componentStack.trim().slice(0, STACK_LIMIT)}`;

type ReportState = 'idle' | 'confirm' | 'sending' | 'sent' | 'queued' | 'failed';

const REPORT_TEXT: Partial<Record<ReportState, string>> = {
  sent: 'Report sent. Thank you.',
  queued: "Saved. It'll send when you're back online.",
  failed: "Couldn't send the report.",
};

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  componentStack: string;
  resetKey: number;
  report: ReportState;
  exportMessage: string | null;
}

const Action: React.FC<{ label: string; onPress: () => void; primary?: boolean; disabled?: boolean }> = ({
  label,
  onPress,
  primary,
  disabled,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled: !!disabled }}
    style={({ pressed }) => ({
      height: 52,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: primary ? c.primary : c.bgPaper,
      opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
    })}
  >
    <Text style={{ color: primary ? '#FFFFFF' : c.ink, fontSize: 16, fontWeight: '600' }}>{label}</Text>
  </Pressable>
);

/**
 * Catches render errors anywhere below it. Without it, one thrown error left
 * an offline-only user on a blank screen with no way to reach their data.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, componentStack: '', resetKey: 0, report: 'idle', exportMessage: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught render error:', error, info.componentStack);
    this.setState({ componentStack: info.componentStack ?? '' });
    reviewPromptService.recordCrash().catch(() => {});
  }

  private retry = () => {
    this.setState((s) => ({
      error: null,
      componentStack: '',
      report: 'idle',
      exportMessage: null,
      resetKey: s.resetKey + 1,
    }));
  };

  private exportData = async () => {
    try {
      const result = await dataExportService.exportAllData();
      this.setState({ exportMessage: result.success ? 'Export ready.' : EXPORT_FAILED });
    } catch {
      this.setState({ exportMessage: EXPORT_FAILED });
    }
  };

  private sendReport = async () => {
    const { error, componentStack, report } = this.state;
    if (!error || report === 'sending') return;
    this.setState({ report: 'sending' });
    try {
      const outcome = await feedbackService.submit({
        category: 'bug',
        message: buildCrashReport(error, componentStack),
        includeDeviceInfo: true,
        source: 'crash_screen',
      });
      this.setState({
        report: outcome.status === 'sent' ? 'sent' : outcome.status === 'invalid' ? 'failed' : 'queued',
      });
    } catch {
      this.setState({ report: 'failed' });
    }
  };

  render() {
    const { error, componentStack, report, exportMessage, resetKey } = this.state;
    if (!error) {
      return <React.Fragment key={resetKey}>{this.props.children}</React.Fragment>;
    }

    const device = feedbackService.getDeviceInfo();

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 14 }}>
          <Text style={{ color: c.ink, fontSize: 24, fontWeight: '700', marginTop: 24 }}>Something went wrong.</Text>
          <Text style={{ color: c.ink2, fontSize: 15 }}>Your habits are safe on this device.</Text>

          <View style={{ gap: 10, marginTop: 12 }}>
            <Action label="Try again" primary onPress={this.retry} />
            <Action label="Export my data" onPress={this.exportData} />
            {exportMessage && <Text style={{ color: c.ink2, fontSize: 13 }}>{exportMessage}</Text>}
            {report === 'idle' && (
              <Action label="Send error report" onPress={() => this.setState({ report: 'confirm' })} />
            )}
          </View>

          {(report === 'confirm' || report === 'sending') && (
            <View style={{ gap: 10, marginTop: 8 }}>
              <Text style={{ color: c.ink2, fontSize: 13 }}>
                This sends the text below and your device details. No habit data.
              </Text>
              <View style={{ backgroundColor: c.bgSunken, borderRadius: 12, padding: 12, gap: 8 }}>
                <Text selectable style={{ color: c.ink, fontSize: 12, fontFamily: 'Courier' }}>
                  {buildCrashReport(error, componentStack)}
                </Text>
                <Text style={{ color: c.ink3, fontSize: 12 }}>
                  {`${device.appVersion} · ${device.platform} ${device.osVersion} · ${device.deviceModel ?? 'Unknown device'}`}
                </Text>
              </View>
              <Action label="Send report" primary disabled={report === 'sending'} onPress={this.sendReport} />
              <Action label="Cancel" onPress={() => this.setState({ report: 'idle' })} />
            </View>
          )}

          {REPORT_TEXT[report] && <Text style={{ color: c.ink2, fontSize: 13 }}>{REPORT_TEXT[report]}</Text>}
        </ScrollView>
      </SafeAreaView>
    );
  }
}
```

- [ ] **Step 4: Wire the boundary and lifecycle into `App.tsx`**

Replace the whole of `App.tsx` with:

```tsx
import 'react-native-get-random-values'; // Must be first import for UUID support
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { RootNavigator } from './src/navigation';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { feedbackService } from './src/services/feedback/FeedbackService';
import { reviewPromptService } from './src/services/feedback/ReviewPromptService';

// Single source of truth for the status bar. `style="auto"` follows the OS
// scheme, which is wrong whenever the user has overridden the theme in-app
// (system light + app set to dark would render dark-on-dark text).
function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} translucent />;
}

// Feedback written offline waits in an outbox. Give it a chance to go out on
// every launch and on every return to the foreground.
function useAppLifecycle() {
  useEffect(() => {
    reviewPromptService.recordFirstOpen().catch(() => {});
    feedbackService.flushOutbox().catch(() => {});
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') feedbackService.flushOutbox().catch(() => {});
    });
    return () => sub.remove();
  }, []);
}

export default function App() {
  useAppLifecycle();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <RootNavigator />
              <ThemedStatusBar />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 5: Add the dev-only test button**

In `src/screens/settings/DeveloperToolsScreen.tsx`, add a state hook after the existing `useState` lines:

```tsx
  const [crash, setCrash] = useState(false);
```

Directly before the component's `return (`, add:

```tsx
  // Throwing during render is what the crash screen catches; an error in an
  // event handler would not reach it.
  if (crash) throw new Error('Test crash from Developer tools');
```

Add this button after the "Remove demo data" `<Button ... />`:

```tsx
          <Button title="Throw test error" variant="ghost" fullWidth onPress={() => setCrash(true)} />
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx jest tests/ErrorBoundary.test.tsx && npx tsc --noEmit && npx eslint src/ tests/ --quiet`

Expected: 5 passed; tsc and eslint exit 0.

- [ ] **Step 7: Run the whole suite and the iOS bundle**

Run: `TZ=UTC npx jest --ci && npx expo export --platform ios --output-dir /tmp/itrackhabit-export && rm -rf /tmp/itrackhabit-export`

Expected: all tests pass; the export finishes without a module-resolution error.

- [ ] **Step 8: Commit**

```bash
git add src/components/ErrorBoundary.tsx App.tsx src/screens/settings/DeveloperToolsScreen.tsx tests/ErrorBoundary.test.tsx
git commit -m "Catch render crashes with a screen that keeps data reachable

A thrown render error used to leave a blank screen. Now the user can
try again, export their data, or send a report after seeing exactly
what it contains. A crash also holds off the rating prompt for a week.
The app flushes queued feedback on launch and on return to the
foreground. Developer tools gains a button to trigger the screen."
```

---

### Task 8: Dark mode, version, privacy policy and listing

**Files:**
- Modify: `app.json`
- Modify: `PRIVACY_POLICY.md`
- Modify: `store.json`

**Interfaces:**
- Consumes: `expo-system-ui` (installed in Task 0).
- Produces: version `1.1.0`.

- [ ] **Step 1: app.json**

Change `"version": "1.0.2"` to `"version": "1.1.0"`.

Change `"userInterfaceStyle": "light"` to `"userInterfaceStyle": "automatic"`.

- [ ] **Step 2: PRIVACY_POLICY.md**

Make these edits; the wording is exact.

1. Line 3 becomes `**Last updated: <today's date as e.g. October 24, 2026>**`. Use the date the commit is made.

2. In "Introduction", replace the paragraph starting "The short version:" with:

```markdown
The short version: iTrackHabit works entirely on your device. There is no
account to create, no server to sign in to, and nothing about your habits is
sent to us. The only thing that ever leaves your device is feedback you choose
to send us from the app.
```

3. In "Information We Collect", replace the paragraph starting "**We do not collect any personal information.**" with:

```markdown
**We collect nothing automatically.** iTrackHabit has no user accounts, and
your habits, progress, and everything else you enter stay on your device. The
only information that reaches us is feedback you choose to send — see
"Feedback You Send" below.
```

4. In "What the app does not collect", replace the line `- No advertising identifiers or device identifiers` with:

```markdown
- No advertising identifiers or device identifiers (feedback carries only a
  random ID the app makes up, described below)
```

5. Insert a new section directly before "## Reminders and Notifications":

```markdown
## Feedback You Send

Profile → Send feedback, and the "Send error report" button on the screen the
app shows if it ever crashes, let you send us a message. Nothing is sent until
you tap Send, and the screen shows what will go. A message contains:

- The category you picked and the text you wrote
- Your email address, only if you type one in so we can reply
- Device details, unless you switch them off: app version, iOS or Android
  version, and device model
- A random ID that the app generates on your device. It is not linked to you,
  your device's hardware, or any account; we use it only to stop one device
  flooding us with messages
- For error reports, the technical error text the screen showed you

Feedback is stored by Supabase, our database provider, in its Tokyo, Japan
data centre (Amazon Web Services, ap-northeast-1), and read only by us. We
delete each message 24 months after it arrives. To have a message deleted
sooner, email us with the date you sent it and roughly what it said.
```

6. In "Third-Party Services", replace the first paragraph with:

```markdown
iTrackHabit contains no advertising, no analytics or tracking SDKs, no
social-media integrations, and no in-app purchases. We do not sell, rent, or
share your information with anyone. The only service that handles anything
from the app is Supabase, which stores the feedback you choose to send on our
behalf.
```

7. In "Data Retention and Deletion", replace the paragraph starting "Because we hold no copy of your data" with:

```markdown
Apart from feedback you send, we hold no copy of your data, so there is
nothing for us to delete on our side and nothing we could restore for you —
export a backup first if you want to keep your history.
```

8. In "Your Rights", replace `We hold no personal data about you, so there is no request you need to send us` with `Apart from any feedback you have sent, we hold no personal data about you, so there is no request you need to send us`.

Then read the file top to bottom. No sentence may still claim that nothing ever leaves the device. Expected remaining matches for "never transmitted" are only the "What the app stores on your device" paragraph, which is about habit data and stays true.

- [ ] **Step 3: store.json**

In `apple`, change `"version": "1.0.2"` to `"version": "1.1.0"`.

In `apple.info.en-GB.description`:
- Replace `• Your data leaves only when you export it yourself` with `• Your habits leave your device only when you export them`.
- After `• Optional Face ID or Touch ID lock for the app`, add the line `\n• Send us feedback straight from the app`.

In `apple.info.en-GB`, add after `"promoText"`:

```json
        "releaseNotes": "Send us feedback from Profile → Send feedback. Faster stats and check-ins for long-time users. Dark mode now follows your phone. Fixes a calendar glitch around daylight-saving changes.",
```

In `apple.review.notes`:
- Replace `There is no backend server, no user account, and\nno network request in normal use, so the app works with airplane mode on. Nothing is collected, transmitted, or shared.` with `There is no user account, and habit data never leaves the device, so the app works with airplane mode on. The one network request is optional: Profile → Send feedback posts the message the user writes (plus device model and OS, which they can switch off) to our feedback inbox.`
- Replace `5. Profile → Export & backup writes the data to a JSON or CSV file. This is the only way data leaves the device, and only when you tap it.` with `5. Profile → Export & backup writes the data to a JSON or CSV file, and only when you tap it.\n6. Profile → Send feedback sends a message to us. This is the only data the app sends anywhere.`
- Replace `No account, no analytics, no advertising, no third-party SDKs collecting data. Because there is no server, there is nothing to delete server-side;` with `No account, no analytics, no advertising, no third-party SDKs collecting data. Only feedback the user chooses to send is stored server-side;`

Run: `node -e "JSON.parse(require('fs').readFileSync('store.json','utf8')); JSON.parse(require('fs').readFileSync('app.json','utf8')); console.log('json ok')"`

Expected: `json ok`.

- [ ] **Step 4: Commit**

```bash
git add app.json PRIVACY_POLICY.md store.json
git commit -m "Prepare 1.1.0: dark mode follows the phone, privacy copy covers feedback

userInterfaceStyle was pinned to light, so the System theme never went
dark. The privacy policy, listing and review notes now say plainly
that feedback the user chooses to send is the one thing that leaves
the device, what it contains, where it is stored, and for how long."
```

---

### Task 9: Verification on devices, then final review

**Files:**
- Modify: this plan's Measurements table only.

- [ ] **Step 1: Full automated checks**

Run:

```bash
npx tsc --noEmit && npx eslint src/ tests/ --quiet && \
for tz in UTC America/Los_Angeles Pacific/Auckland Europe/London; do TZ=$tz npx jest --ci || echo "FAILED in $tz"; done && \
TZ=UTC npx jest --ci --coverage && \
npx expo export --platform ios --output-dir /tmp/itrackhabit-export && rm -rf /tmp/itrackhabit-export
```

Expected: every step exits 0, no `FAILED` line, and the coverage thresholds pass.

- [ ] **Step 2: After-timings on the Samsung**

The dev client from Task 0 already contains every native module. Start Metro with `npx expo start --dev-client --clear`, run `adb -s R5GL75ZVW1B reverse tcp:8081 tcp:8081`, and reload the app.

Repeat Task 0 Step 6 exactly: same demo data, Analytics opened 3 times, 3 toggles.

Run: `adb -s R5GL75ZVW1B logcat -d -s ReactNativeJS | grep "\[perf\]"`

Fill the "After" column. Targets (dev build): check-in saved < 100 ms; analytics load < 300 ms. If a target is missed, report the numbers to the user rather than tuning further; dev builds run slower than release builds.

- [ ] **Step 3: Feedback, end to end, on the Samsung**

1. Profile → Send feedback. Pick "I have an idea", message `[TEST] online from Samsung`, and send. Expected: "Thank you — we read every message."
2. Run `adb -s R5GL75ZVW1B shell cmd connectivity airplane-mode enable`. Send `[TEST] offline from Samsung`. Expected: "Saved. It'll send automatically when you're back online."
3. Run `adb -s R5GL75ZVW1B shell cmd connectivity airplane-mode disable`, press Home, wait 10 s, then reopen the app.
4. Confirm both rows arrived and clean up. The password goes in the environment only:

```bash
cd /private/tmp/claude-501/-Users-bishalaryal-Documents-Github-iTrackHabit/043820e9-e5bc-4bba-873c-cb7be8347f5c/scratchpad/pgtool
DB_URL="postgresql://postgres:<password from the user>@db.abpyvxtteulfyhprmaad.supabase.co:5432/postgres" \
  node q.js "select message, platform, device_model, source from public.feedback where message like '[TEST]%' order by created_at" \
            "delete from public.feedback where message like '[TEST]%'"
```

Expected: two rows with `platform = android` and source `profile`, then `deleted 2`. If the password has been rotated, ask the user for the new one, or ask them to check the dashboard.

- [ ] **Step 4: Crash screen on the Samsung**

Profile → Developer tools → **Throw test error**. Expected: "Something went wrong."

Then:
1. Tap **Export my data**: the share sheet opens.
2. Tap **Send error report**: the preview starts with `Error: Test crash from Developer tools`.
3. Tap **Send report**: "Report sent. Thank you."
4. Tap **Try again**: the app returns to the tabs.

Delete the report with the same command as Step 3, using `where message like 'Error: Test crash%'`.

- [ ] **Step 5: Dark mode on the Samsung**

In Profile, choose **System**.

Run `adb -s R5GL75ZVW1B shell cmd uimode night yes`. Expected: the app turns dark.

Run `adb -s R5GL75ZVW1B shell cmd uimode night no`. Expected: it turns light.

- [ ] **Step 6: iOS simulator**

Run: `npx expo run:ios`. This builds a simulator dev build with the installed Xcode; beta Xcode is fine for the simulator.

Then:
1. Repeat Step 3's online send (`[TEST] online from iOS simulator`) and Step 4.
2. Run `xcrun simctl ui booted appearance dark`, then `light`, with the theme on System.
3. Delete the `[TEST]` and `Error: Test crash%` rows as in Step 3.

- [ ] **Step 7: Code review of the branch**

Read the `requesting-code-review` skill and follow it. The skill file is `~/.claude/plugins/cache/claude-plugins-official/superpowers/6.4.1/skills/requesting-code-review/SKILL.md` if the Skill tool does not list it. Review every commit since `2321070`, fix what it confirms, and rerun Step 1.

- [ ] **Step 8: Commit the measurements**

```bash
git add docs/superpowers/plans/2026-10-24-growth-release.md
git commit -m "Record before-and-after timings for 1.1.0"
```

---

### Task 10: Release (only after the user says go)

The steps below publish to the App Store. Do not start them without the user's explicit go-ahead in the conversation.

- [ ] **Step 1:** `npx eas-cli build --platform ios --profile production --non-interactive`. Expected: the build succeeds on the `macos-sequoia-15.6-xcode-26.0` image, and the build number auto-increments.
- [ ] **Step 2:** `npx eas-cli metadata:push`. Expected: the listing, review notes and release notes in `store.json` are uploaded.
- [ ] **Step 3:** `npx eas-cli submit --platform ios --profile production --latest`.
- [ ] **Step 4: Hand the user this checklist; these are manual steps.**
  - App Store Connect → App Privacy: set the four data types from spec Part 5. All are "App Functionality", none are used for tracking, and only Email Address is linked to the user.
  - Update the published privacy policy at biszaaltech.com/apps/itrackhabit/privacy to match `PRIVACY_POLICY.md`.
  - Merge `master` into `main` and push, so the daily keep-alive workflow starts running.
  - Reset the Supabase database password.

---

## Measurements

Dev build on Samsung SM-S948B (Android 17), demo data of 6 habits with about 4 months of history. Medians of 3 runs.

| Metric | Before | After | Target |
|---|---|---|---|
| `[perf] check-in saved` (ms) | | | < 100 |
| `[perf] analytics load` (ms) | | | < 300 |
