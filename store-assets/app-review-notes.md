# App Review Information — Notes

Paste the section below into **App Store Connect → your app → the version →
App Review Information → Notes**. Keep the sign-in fields blank and leave
"Sign-in required" switched **off**.

---

## Note for the reviewer

No sign-in is required. iTrackHabit has no accounts and no login screen —
opening the app takes you straight to the habit list, and every feature is
available immediately.

The app is fully offline. Habits and their history are stored on the device
in a local SQLite database. There is no backend server, no user account, and
no network request in normal use, so the app works with airplane mode on.
Nothing is collected, transmitted, or shared.

There is no paid tier, no subscription, and no in-app purchase. Every feature
is free and unlocked.

**How to try it in about a minute**

1. Open the app. Two starter habits are created on first launch.
2. Tap the circle on the right of a habit row to mark it done — the ring at
   the top updates immediately.
3. Tap "+" to add a habit, or use Templates to pick a prepared one.
4. Open the Insights and Awards tabs to see charts and achievements. These
   fill out as habits are completed, so on a fresh install they will be
   mostly empty — this is expected, not a defect.
5. Profile → Export & backup writes the data to a JSON or CSV file. This is
   the only way data leaves the device, and only when you tap it.

**Permissions**

The app asks for notification permission only, and only to schedule local
habit reminders. These are local notifications; there is no push server and
no device token is sent anywhere.

Profile → Privacy & security offers an optional biometric app lock. It is
**off by default** and must be switched on deliberately, so it will not block
review. If you do enable it, the system passcode works as a fallback.

**Data and privacy**

No account, no analytics, no advertising, no third-party SDKs collecting
data. Because there is no server, there is nothing to delete server-side;
uninstalling the app removes all of its data. Account deletion requirements
under 5.1.1(v) do not apply, as no account is ever created.

Thank you for reviewing.
