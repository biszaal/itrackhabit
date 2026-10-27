# Google Play: first release of iTrackHabit

Everything Play Console asks for, in the order it asks. Package name:
`com.biszaal.itrackhabit`. Build: version 1.1.0, version code 3, targets API 36.

Google only lets EAS upload builds after the first one has been uploaded by hand
in Play Console. So the first release goes in manually, and later ones can use
`eas submit -p android` once a service account key exists (see the end).

## 1. Create the app

Play Console → **Create app**

| Field | Value |
|---|---|
| App name | `iTrackHabit – Habit Tracker` |
| Default language | English (United Kingdom) – en-GB |
| App or game | App |
| Free or paid | Free (this cannot be changed later) |

## 2. Store listing (Grow → Store presence → Main store listing)

**Short description** (80 characters max):

```
A calm, private habit tracker. Works offline: no account, no ads, no tracking.
```

**Full description:**

```
Build Better Habits, One Day at a Time

iTrackHabit is a calm, beautifully designed habit tracker that runs entirely on your phone. There is no account to create and no server to sign in to. Open the app and start tracking.

Genuinely Private
• Works completely offline; your habits never leave your phone
• No account, no sign-up, no cloud
• No ads, no analytics, no tracking of any kind
• Your habits leave your phone only when you export them

Beautiful and Simple
• A soft, calm interface that's easy on the eyes
• Smooth animations and satisfying check-offs
• Clean, distraction-free experience
• Light and dark mode that follows your phone

Smart Habit Tracking
• Track daily, weekly, or custom frequency habits
• Set specific targets (time, count, or custom metrics)
• Visual progress rings and completion tracking
• Start from a habit template or build your own
• A focus timer for habits you sit down to do

Insights That Stay on Your Phone
• Charts showing your progress over time
• Streak tracking and completion rates
• Patterns and suggestions, calculated on your phone from your own records

Motivation and Achievements
• Earn badges for consistency and milestones
• Build streaks and celebrate every step

Yours to Keep
• Export everything to a JSON or CSV file whenever you like
• Import it back on a new phone
• Optional fingerprint or face unlock for the app
• Send us feedback straight from the app

Completely free, with every feature unlocked. No subscriptions, no in-app purchases, no premium tier.
```

**Graphics** (files in this folder):

| Slot | File |
|---|---|
| App icon (512 × 512) | `icon-512.png` |
| Feature graphic (1024 × 500) | `feature-graphic.jpg` |
| Phone screenshots (2–8) | `phone-01-today.png` … `phone-06-awards.png` |

The screenshots come from the iOS simulator with the iOS status bar cropped off,
and they predate 1.1.0 (the Insights one still shows the old "AI insights"
heading at the bottom edge). Replace them with captures from an Android phone
when you can.

**Category:** Productivity. **Email:** hello@biszaaltech.com.
**Website:** https://www.biszaaltech.com

## 3. App content (Policy → App content)

| Section | Answer |
|---|---|
| Privacy policy | https://www.biszaaltech.com/apps/itrackhabit/privacy (update the page to match `PRIVACY_POLICY.md` first) |
| Ads | No, the app does not contain ads |
| App access | All functionality is available without special access |
| Content rating | Category "All other app types". Answer No to every content question, including "Can users interact or exchange content?" Feedback goes only to us. Expected result: Everyone / PEGI 3 |
| Target audience | 13 and over (keeps the app outside the Designed for Families programme) |
| News app | No |
| Government app | No |
| Financial features | None |
| Health apps | The app tracks general habits and wellness routines; it has no medical features and reads no health or sensor data |

### Data safety

| Question | Answer |
|---|---|
| Does the app collect or share any required user data types? | Yes |
| Is all collected data encrypted in transit? | Yes (HTTPS) |
| Can users request that their data is deleted? | Yes, by emailing hello@biszaaltech.com (described in the privacy policy) |

Data types. Nothing is **shared**, nothing is **processed ephemerally**, and all
of it is **optional**, because it is sent only when the user taps Send feedback:

| Data type | Collected | Purpose |
|---|---|---|
| Personal info → Email address | Yes, only if the user types one in | App functionality (replying to feedback) |
| App activity → Other user-generated content | Yes (the feedback message) | App functionality |
| App info and performance → Crash logs | Yes (error text, only when the user sends an error report) | App functionality |
| App info and performance → Diagnostics | Yes (app version, Android version, device model; the user can switch these off) | App functionality |
| Device or other IDs | Yes (a random ID the app generates, used only to rate-limit) | Fraud prevention, security, and compliance |

Habit data is never collected: it stays on the phone.

## 4. Testing, then production

1. **Testing → Internal testing → Create new release.** Upload the `.aab` from
   the EAS production build, paste the release notes below, add yourself as a
   tester, and install from the opt-in link on a real phone.
2. **If the developer account is a personal account created after
   13 November 2023,** Google requires a **closed test with at least 12 testers
   for 14 days in a row** before production access is granted. Start this
   straight away; it is the longest step.
3. **Production → Create new release** with the same build once testing (and,
   if it applies, the 14-day closed test) is done.

Release notes:

```
Send us feedback from Profile → Send feedback. Faster stats and check-ins for long-time users. Dark mode now follows your phone. Fixes a calendar glitch around daylight-saving changes.
```

## 5. Automate later uploads

Play Console → Setup → API access → create a service account with the
**Release manager** role, download its JSON key, and save it as
`frontend/google-service-account-key.json` (gitignored; never commit it). After
that, `eas submit -p android --profile production --latest` uploads new builds.
The upload key the app is signed with is managed by EAS
(`eas credentials -p android`); Play App Signing holds the app signing key.
