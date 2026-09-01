# App Store screenshots

Regenerates the listing screenshots from the app as it currently builds, so the
store page cannot drift away from the shipped UI.

It has drifted before. The set this replaced had captions sitting above the
wrong screens ("Every day, one clear list" over Templates), a "Synced" badge for
a feature the app does not have, a `Premium` pill App Review specifically asked
about, and a whole size slot left over from a design two rewrites old — one of
which showed the placeholder text "Chart visualization would go here".

## Regenerating

1. **Build the app onto a simulator.** A local build is enough and costs no EAS
   credits; screenshots never need an EAS build.

   ```sh
   xcrun simctl create AppStore-6.9 \
     com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro-Max \
     com.apple.CoreSimulator.SimRuntime.iOS-18-5
   npx expo run:ios --device <udid> --configuration Release
   ```

   The 6.9" slot wants an iPhone 16 Pro Max (1320×2868); the iPad slot wants an
   iPad Pro 13" (2048×2732). The 6.5" slot is rendered from the phone captures.

2. **Seed history.** A fresh install shows "0 of 2 done" and empty charts.

   ```sh
   node scripts/store-screenshots/seed.js <udid>
   ```

   This writes into the app's SQLite file directly — there is no demo mode in
   the shipped binary, and there must not be one.

3. **Capture each screen** listed in `shots.js` to
   `captures/phone/<screen>.png` (and `captures/tablet/` for the iPad):

   ```sh
   node scripts/store-screenshots/sim.js tap  <udid> 0.5 0.95   # normalised
   node scripts/store-screenshots/sim.js shot <udid> captures/phone/today.png
   ```

   Check each capture is the screen its caption claims before moving on. That
   check is the entire point of this directory.

4. **Render and sync.**

   ```sh
   node scripts/store-screenshots/build.js
   ```

   Writes into `store/apple/screenshot/en-GB/`, prunes files no longer
   referenced, and rewrites the `screenshots` block in `store.json`.

5. **Push**, once the results have been looked at:

   ```sh
   npx eas metadata:push
   ```

## Rules for `shots.js`

- The caption and the screen it describes live in the same record. Do not split
  them.
- A badge must point at something actually visible in that capture.
- Nothing may imply sync, accounts, or a paid tier. The app has none, the store
  description says so, and App Review has already asked about it once.
