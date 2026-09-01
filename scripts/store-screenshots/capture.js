#!/usr/bin/env node
/**
 * Captures every screen listed in shots.js off a booted simulator.
 *
 *   node scripts/store-screenshots/capture.js <udid> <phone|tablet>
 *
 * Navigation goes through the database, not taps and not URLs. This machine has
 * no Simulator GUI to tap with, and `simctl openurl` raises an "Open in
 * iTrackHabit?" confirmation that would itself need a tap. So each screen is
 * selected by writing `screenshot_screen` into the app's metadata table and
 * relaunching; the temporary hook in src/navigation/index.tsx reads it on boot.
 *
 * If every capture comes back showing Home, that hook is missing from the build
 * installed on the device.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUNDLE_ID = 'com.biszaal.itrackhabit';

const [, , udid, kind = 'phone'] = process.argv;
if (!udid) {
  console.error('usage: capture.js <udid> <phone|tablet>');
  process.exit(1);
}

// `seed-habit-1` is the timed "Morning run" seed.js creates, so the focus timer
// opens against a real habit rather than an empty one.
const ROUTES = [
  ['today', 'Home'],
  ['templates', 'HabitTemplates'],
  ['focus', 'HabitTimer:seed-habit-1'],
  ['calendar', 'Calendar'],
  ['insights', 'Analytics'],
  ['awards', 'Achievements'],
];

const sh = (cmd, args, opts) =>
  execFileSync(cmd, args, { encoding: 'utf8', stdio: 'pipe', ...opts });
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const container = sh('xcrun', ['simctl', 'get_app_container', udid, BUNDLE_ID, 'data']).trim();
const dbPath = path.join(container, 'Documents/SQLite/itrackhabit.db');
if (!fs.existsSync(dbPath)) {
  console.error(`No database at ${dbPath} — launch the app once, then seed.js.`);
  process.exit(1);
}

// First of the previous month — the most recent one the seed covers in full.
const lastFull = new Date();
lastFull.setDate(1);
lastFull.setMonth(lastFull.getMonth() - 1);
const LAST_FULL_MONTH = lastFull.toISOString().slice(0, 10);

const outDir = path.join(__dirname, 'captures', kind);
fs.mkdirSync(outDir, { recursive: true });

for (const [name, target] of ROUTES) {
  try {
    sh('xcrun', ['simctl', 'terminate', udid, BUNDLE_ID]);
  } catch {
    // Not running is fine.
  }
  sleep(1000);

  // August 2026 is the last month the seeded history covers end to end; the
  // current month is only a couple of days old and would show an empty grid.
  const now = new Date().toISOString();
  sh('sqlite3', [dbPath], {
    input:
      `INSERT OR REPLACE INTO metadata (key,value,updatedAt) VALUES ('screenshot_screen','${target}','${now}');\n` +
      `INSERT OR REPLACE INTO metadata (key,value,updatedAt) VALUES ('screenshot_month','${LAST_FULL_MONTH}','${now}');`,
  });

  sh('xcrun', ['simctl', 'launch', udid, BUNDLE_ID]);
  // Cold start, storage open, the hook's own delay, then the screen's own load.
  sleep(15000);

  const out = path.join(outDir, `${name}.png`);
  sh('xcrun', ['simctl', 'io', udid, 'screenshot', '--type=png', out]);

  console.log(`${name}  <-  ${target}`);
}

// Leave the app in its normal state so a later manual launch is not hijacked.
try {
  sh('sqlite3', [dbPath], { input: "DELETE FROM metadata WHERE key IN ('screenshot_screen','screenshot_month');" });
} catch {
  // Non-fatal.
}

console.log(`\nCaptured ${ROUTES.length} screens into ${path.relative(process.cwd(), outDir)}`);
console.log('Check each one is the screen its caption in shots.js describes.');
