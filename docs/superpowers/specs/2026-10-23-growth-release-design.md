# iTrackHabit 1.1.0 — Growth Release Design

**Date:** 2026-10-23
**Status:** Awaiting review
**Scope:** iOS release 1.1.0. Android launch and retention features are separate specs (see "Out of scope").

## Why

Downloads are growing. Before more people arrive, the app needs three things it does not have today:

1. A way for users to tell us what is wrong or missing (in-app feedback).
2. A safety net when something breaks, so a crash never strands a user's data.
3. Speed that holds up for long-term users. Today the app gets slower the more history a user has, so the most loyal users get the worst experience.

It also adds a well-timed rating prompt, because store ratings drive store ranking and keep the download wave going.

## Decisions already made

| Decision | Choice |
|---|---|
| Feedback transport | Anonymous inbox on the user's own Supabase project `itrackhabit` (`abpyvxtteulfyhprmaad`), not email |
| Server shape | One Postgres function behind PostgREST. No Edge Function, no account login needed to deploy |
| Reading feedback | Supabase dashboard table editor. No notifications in this release |
| Analytics / crash SDKs | None. Habit data never leaves the device; the privacy promise stays true for everything except feedback the user chooses to send |
| Crash visibility | Apple's built-in crash reports (App Store Connect / Xcode Organizer) plus user-sent crash reports from the new error screen |

## Part 1 — Feedback inbox (Supabase)

### Table `public.feedback`

| Column | Type | Rule |
|---|---|---|
| `id` | `uuid` | primary key, `gen_random_uuid()` |
| `created_at` | `timestamptz` | default `now()`, indexed |
| `category` | `text` | one of `bug`, `idea`, `confusing`, `praise` |
| `message` | `text` | trimmed length 1–4000 |
| `contact_email` | `text` null | optional; ≤ 254 chars and a basic `x@y.z` shape |
| `source` | `text` | `profile` or `crash_screen` |
| `app_version` | `text` null | ≤ 32 chars, e.g. `1.1.0 (31)` |
| `platform` | `text` null | `ios` or `android` |
| `os_version` | `text` null | ≤ 32 chars |
| `device_model` | `text` null | ≤ 64 chars |
| `install_id` | `uuid` | random per install, generated on the phone; used only for rate limiting; indexed with `created_at` |
| `status` | `text` | `new` (default), `read`, `done` — for triage in the dashboard |

Row-level security is **on with no policies**, and all table privileges are revoked from `anon` and `authenticated`. The publishable key cannot read, insert, update or delete rows directly.

### Function `public.submit_feedback(...) returns uuid`

- `SECURITY DEFINER`, `set search_path = ''`, fully qualified table names. `EXECUTE` revoked from `public`, granted to `anon` only.
- Parameters mirror the columns above, minus `id`, `created_at` and `status`.
- Validates every field. Invalid input raises an error with SQLSTATE `22023` (invalid parameter), so PostgREST returns HTTP 400.
- Rate limits:
  - **Per install:** at most 5 rows per rolling 24 hours. Over the limit, it raises with message `rate_limited_install`.
  - **Global:** at most 300 rows per rolling hour across all installs. Over the limit, it raises with message `rate_limited_global`.
  - Both use SQLSTATE `P0001`. The client tells them apart by message.
- Retention: each call also deletes rows older than 24 months. This keeps the promise in the privacy policy without needing a scheduler.

### Function `public.ping() returns text`

Returns `'ok'` after a trivial read of `feedback`. `EXECUTE` is granted to `anon`. It is used only by the keep-alive job.

### Keep-alive

A GitHub Actions workflow in the `frontend` repo (`.github/workflows/supabase-keepalive.yml`) runs daily on a cron schedule. It POSTs to `/rest/v1/rpc/ping` with the publishable key, so a free-plan project is never idle long enough to pause. The URL and key are written directly into the workflow, because both are public values that already ship inside the app. GitHub runs scheduled workflows only from the default branch (`main`), so the job starts once this work is merged there.

### Repo layout and deployment

- The migration lives at `frontend/supabase/migrations/<timestamp>_feedback.sql`.
- It is applied with `supabase db push --db-url "$DB_URL"`, with the database password provided through an environment variable for that one command only. The password is never written to any file.
- After setup, the user resets the database password in the Supabase dashboard, because it was shared in chat.
- The migration must be applied, and checked (see Testing), **before** the 1.1.0 build is submitted.

## Part 2 — Feedback in the app

### New code

- `src/config/feedback.ts` holds the project URL, the publishable key, and the store review URLs. These values are public by design. They are constants, not env vars, because EAS builds do not upload gitignored `.env` files.
- `src/services/feedback/FeedbackService.ts`:
  - `submit(input)` builds the payload and POSTs to `/rest/v1/rpc/submit_feedback` with the `apikey` header and a 10-second timeout.
  - Outcomes: `sent`, `queued` (network error, 5xx, or `rate_limited_global`), `rate_limited` (`rate_limited_install`; the message is still queued and retried the next day), `invalid` (any other 400; the message is dropped and the error shown). PostgREST returns 400 for both validation errors and the rate-limit errors, so the client must check the error message before treating a 400 as invalid.
  - **Outbox:** queued messages are kept in AsyncStorage under `feedback_outbox` (at most 20; the oldest is dropped beyond that).
  - `flushOutbox()` runs at app start (non-blocking, after DataService init), whenever the app returns to the foreground (`AppState`), and when the feedback screen opens. A message is removed when it is sent, or when it is rejected as invalid.
  - `install_id` is a UUID v4 created on first use and stored under `feedback_install_id`.
  - Device info comes from `Constants.expoConfig.version`, `expo-application` `nativeBuildVersion` (added as an explicit dependency), `Platform.OS`, `Platform.Version`, and `expo-device` `modelName`.
- `src/screens/settings/FeedbackScreen.tsx`, a new stack route `Feedback`, built from the existing `Screen`, `AppHeader`, `Chip`, `Field`, `Card` and `Button` components. Top to bottom:
  1. Category chips: "Something's broken" (`bug`), "I have an idea" (`idea`), "Something's confusing" (`confusing`), "I love something" (`praise`).
  2. Message field (multiline, with a character counter up to 4000).
  3. Optional email field: "Only if you'd like a reply."
  4. A "Include device info" switch, on by default, that shows the exact values that will be sent.
  5. Privacy line: "This sends only what you see here. Your habits stay on your device."
  6. Send button, disabled until a category is chosen and the message is non-empty.
- Result states:
  - `sent`: "Thank you — we read every message."
  - `queued`: "Saved. It'll send automatically when you're back online."
  - `rate_limited`: "Thanks for all the feedback today! This one will send tomorrow."
  - `invalid`: inline error.
  - After `sent` or `queued`, the form clears.

### Entry points

- Profile → "Support" group gets two new rows above "About iTrackHabit":
  - "Send feedback" opens the `Feedback` route.
  - "Rate iTrackHabit" opens the store's write-review page (Part 3).
- The crash screen (Part 4.1).

## Part 3 — Rating prompt

Uses `expo-store-review` (~8.1.5), through a new `src/services/feedback/ReviewPromptService.ts`.

**Automatic prompt.** It is shown only when all of these hold:

- The app was first opened at least 3 days ago. `first_open_at` is recorded on first launch.
- No automatic prompt has been shown in the last 120 days (`last_review_prompt_at`).
- No crash screen has been shown in the last 7 days (`last_crash_at`).
- `StoreReview.isAvailableAsync()` is true.

It triggers on a `done` check-in that brings a habit's current streak to exactly 7, 30 or 100, or brings total completions to exactly 25. It is called after the check-in has already updated the UI (see 4.2), so it never interrupts the tap.

It never asks an opinion question before or alongside the prompt. Google Play's review policy forbids that, and Apple discourages it.

**Manual row.** "Rate iTrackHabit" opens:

- iOS: `https://apps.apple.com/app/id6751805707?action=write-review`
- Android: `market://details?id=com.biszaal.itrackhabit`, falling back to the `https://play.google.com/store/apps/details?id=…` URL.

## Part 4 — Stability and speed

### 4.1 Crash screen (error boundary)

`src/components/ErrorBoundary.tsx` is a class component. It sits inside `SafeAreaProvider` and outside `ThemeProvider`, so it still works if theming is what failed, and its fallback uses fixed light-palette tokens.

The fallback shows:

- "Something went wrong. Your habits are safe on this device."
- **Try again:** resets the boundary and remounts the app tree.
- **Export my data:** calls `dataExportService.exportAllData()` inside a try/catch, with its own error message if that fails too.
- **Send error report:** first shows the exact text that will be sent: `name: message` plus the first 1,500 characters of the component stack, and the device info. Then it submits through `FeedbackService` as category `bug`, source `crash_screen`, so it also uses the outbox.

`componentDidCatch` records `last_crash_at` and keeps the existing `console.error`.

`DeveloperToolsScreen` (dev builds only) gets a "Throw test error" button, used to verify the screen.

### 4.2 Check-ins feel instant

In `DataService.markHabitProgress`:

- Remove the `socialService.trackHabitCompletion` call. It belongs to the removed social feature and reloads every habit's full history on each tap. During implementation, confirm that nothing reads the activity feed it writes to.
- The achievement check and the review-prompt check run **after** the method returns, without being awaited. They are serialised: if a check is already running, the new request sets a flag and one more check runs afterwards.
- Target: with 10 habits and a year of history, a tap updates the UI in under 100 ms on the Samsung SM-S948B.

### 4.3 Stats use one query instead of thousands

`OfflineStorage` gets:

- `getAllProgress()`: one query for all progress rows.
- `getProgressInRange(startDate, endDate)`: one query with `date BETWEEN ? AND ?`.
- A new index: `CREATE INDEX IF NOT EXISTS idx_progress_date ON habit_progress(date)`.

`DataService.getHabitsWithStats` loads all progress once, groups it by `habitId` in memory, and calls the existing pure `calculateHabitStats` for each habit.

`DataService.getDailyStats`:

- Loads habits once and progress for the range in one query.
- Builds a `Map<date, Set<habitId>>` of `done` entries.
- Walks the days with local-date arithmetic: start and end are parsed into year, month and day, then `new Date(y, m, d + i)` is formatted with `toLocalISODate`.
- The "was this habit active on this date" rule is unchanged.

Target: the Analytics tab loads in under 300 ms with 10 habits and 365 days of history on the Samsung. Measure before and after.

### 4.4 Daylight-saving bug

This is fixed by the local-date walk in 4.3. A regression test runs a range across 28 March 2027 under `TZ=Europe/London`. Europe/London is also added to the CI timezone matrix, which today covers only UTC, UTC−8 and UTC+13.

### 4.5 Dark mode follows the phone

- Change `app.json` `userInterfaceStyle` from `"light"` to `"automatic"`.
- Add `expo-system-ui` (~5.0.11), which Android needs for that setting to take effect.
- The in-app "System" option then follows the OS on both platforms.

### 4.6 Sync queue stops growing

While `LOCAL_ONLY` is true, `OfflineStorage.addToSyncQueue` does nothing. At init, the existing `sync_queue` rows are deleted once, guarded by the metadata flag `sync_queue_purged_v1`.

### 4.7 One bad row cannot break the habit list

`mapRowToHabit` and `mapRowToHabitProgress` parse JSON columns through a `safeParse` helper. Malformed JSON yields `undefined` for that field and logs `console.error`. The row is still returned.

### 4.8 Prerequisite: in-progress work

The uncommitted notification and insights changes already in `frontend/` must pass type-check and tests, then be committed as their own commit before this work starts. The user confirms they are meant to ship in 1.1.0.

## Part 5 — Privacy, store listing, release

**`PRIVACY_POLICY.md`** (the repo is the source; the hosted copy on biszaaltech.com must be updated to match):

- "We do not collect any personal information" becomes: "We collect nothing automatically. The only information that leaves your device is feedback you choose to send us."
- A new section, "Feedback you send". It covers:
  - what is sent: category, message, optional email, optional device info, and a random install ID used only to prevent spam;
  - where it is stored: Supabase, our database provider, in the project's hosting region, read from Project Settings → General during implementation;
  - that it is deleted after 24 months;
  - how to ask for deletion: email hello@biszaaltech.com with the date and wording.
- "No usage analytics, crash telemetry, or behavioural tracking" stays true and stays. A crash report is sent only when the user taps Send.

**App Store privacy label** (a manual step in App Store Connect; if the current answer is "Data Not Collected", it changes to):

| Data type | Purpose | Linked to user | Tracking |
|---|---|---|---|
| Contact Info → Email Address (optional) | App Functionality | Yes | No |
| User Content → Customer Support | App Functionality | No | No |
| Diagnostics → Other Diagnostic Data (device model, OS) | App Functionality | No | No |
| Identifiers → Device ID (random install ID) | App Functionality | No | No |

**Listing (`store.json`):**

- The bullet "Your data leaves only when you export it yourself" becomes "Your habits leave your device only when you export them".
- Add a bullet: "Send feedback straight from the app".
- The other claims ("no ads, no analytics, no tracking", "no account, no cloud") stay true.

**Release:**

- Version `1.1.0`. The iOS build number is auto-incremented by EAS on the pinned Xcode 26 image.
- What's New: "Send us feedback from Profile → Send feedback. Faster stats and check-ins for long-time users. Dark mode now follows your phone. Fixes a calendar glitch around daylight-saving changes."

## Testing

**Unit tests (Jest, run in CI across all timezones):**

- `FeedbackService`: the payload shape, with and without device info; outcome mapping for 200, 400, `rate_limited_install`, `rate_limited_global`, network error and timeout; outbox add, flush, drop-on-invalid, and the cap of 20.
- `ReviewPromptService`: each eligibility rule and each trigger, plus the "no prompt within 7 days of a crash" rule.
- `getDailyStats`: output equal to the old algorithm on seeded data, plus the Europe/London DST range including today.
- `getHabitsWithStats`: stats identical to the per-habit version on seeded data.
- `safeParse` row mapping with corrupt JSON.
- `ErrorBoundary`: the fallback renders on a thrown child, and "Try again" remounts.

**Database checks** (curl against the live project after the migration):

- A valid `submit_feedback` call returns a UUID, and the row appears.
- A bad category returns 400.
- A 4,001-character message returns 400.
- A malformed email returns 400.
- The 6th call from one `install_id` within 24 hours returns `rate_limited_install`.
- With the publishable key, `GET /rest/v1/feedback` and `POST /rest/v1/feedback` are both denied.
- `rpc/ping` returns `ok`.
- Test rows are deleted afterwards.

**On devices** (Samsung SM-S948B on Android 17, via a dev build, and the iOS simulator):

- Send feedback online; the row appears in the dashboard.
- Send in airplane mode; the "Saved" state shows; after reconnecting and foregrounding the app, the row arrives.
- "Throw test error" shows the crash screen; Export and Send report both work; "Try again" recovers.
- The System theme follows the OS dark-mode toggle.
- Seed a year of data for 10 habits, then record Analytics load time and check-in latency, before and after.

## Out of scope (separate specs, in this order)

1. **Android launch:**
   - Expo SDK 54 upgrade, needed to target API 36, which Google Play requires for new apps since 31 Aug 2026.
   - Removing `USE_EXACT_ALARM`.
   - Checking reminder reliability on Samsung battery management.
   - The Play listing and Data safety form.
   - Closed-testing requirements.
2. **Retention:** streak freeze or allowed skip days, a backup reminder, a What's New sheet, and home-screen widgets.
3. **Feedback notifications** (email per message), if volume makes the dashboard impractical.
