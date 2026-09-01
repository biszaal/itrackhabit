#!/usr/bin/env node
/**
 * Seeds a simulator's app database with a plausible three months of history.
 *
 *   node scripts/store-screenshots/seed.js <simulator-udid>
 *
 * A fresh install shows "0 of 2 done" and empty charts, which makes for a poor
 * listing and leaves Insights and Awards with nothing to display. This writes
 * directly into the app's SQLite file so the captures show the real UI doing
 * real work — no mock rendering path, no demo mode in the shipped binary.
 *
 * The completion pattern is deliberately imperfect: streaks that break, one
 * habit that lags. Screenshots claiming a flawless 100% record read as fake.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUNDLE_ID = 'com.biszaal.itrackhabit';
const USER_ID = 'offline_user';

const udid = process.argv[2];
if (!udid) {
  console.error('usage: seed.js <simulator-udid>');
  process.exit(1);
}

const container = execFileSync(
  'xcrun',
  ['simctl', 'get_app_container', udid, BUNDLE_ID, 'data'],
  { encoding: 'utf8' }
).trim();

const dbPath = path.join(container, 'Documents/SQLite/itrackhabit.db');
if (!fs.existsSync(dbPath)) {
  console.error(`No database at ${dbPath}`);
  console.error('Launch the app once so it creates its tables, then re-run.');
  process.exit(1);
}

const iso = (d) => d.toISOString();
const ymd = (d) => d.toISOString().slice(0, 10);

const habits = [
  // [title, emoji-ish icon key, colour, target, unit, timeBased, reliability]
  { title: 'Morning run', color: '#6366F1', target: 30, unit: 'minutes', timeBased: true, hit: 0.86 },
  { title: 'Meditate', color: '#7C9B7E', target: 15, unit: 'minutes', timeBased: true, hit: 0.78 },
  { title: 'Read', color: '#E0A864', target: 20, unit: 'pages', timeBased: false, hit: 0.7 },
  { title: 'Drink water', color: '#4FA3C4', target: 8, unit: 'glasses', timeBased: false, hit: 0.92 },
  { title: 'Practice guitar', color: '#C4756B', target: 20, unit: 'minutes', timeBased: true, hit: 0.55 },
];

const DAYS = 95;
const today = new Date();
today.setHours(12, 0, 0, 0);

const createdAt = new Date(today);
createdAt.setDate(createdAt.getDate() - DAYS);

const sql = [];
sql.push('BEGIN TRANSACTION;');
sql.push('DELETE FROM habit_progress;');
sql.push('DELETE FROM habits;');

// A deterministic generator keeps re-runs identical, so a re-shot screenshot
// does not silently change the numbers the captions describe.
let seed = 20260901;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

const esc = (s) => String(s).replace(/'/g, "''");

habits.forEach((h, hi) => {
  const id = `seed-habit-${hi + 1}`;
  const targetConfig = JSON.stringify({
    targetValue: h.target,
    unit: h.unit,
    isTimeBased: h.timeBased,
  });

  sql.push(
    `INSERT INTO habits (id,userId,title,notes,frequency,isShared,type,targetConfig,color,createdAt,updatedAt,pending)
     VALUES ('${id}','${USER_ID}','${esc(h.title)}','','daily',0,'manual','${esc(targetConfig)}','${h.color}','${iso(createdAt)}','${iso(today)}',0);`
  );

  for (let d = DAYS; d >= 0; d--) {
    const day = new Date(today);
    day.setDate(day.getDate() - d);

    // Today stays partly open so the Today screen shows progress in motion
    // rather than a finished day.
    if (d === 0 && hi >= 3) continue;

    const recency = 1 - d / DAYS; // habits get stickier over time
    if (rand() > h.hit * (0.75 + 0.25 * recency)) continue;

    sql.push(
      `INSERT INTO habit_progress (id,habitId,date,status,currentValue,targetValue,unit,updatedAt,pending)
       VALUES ('seed-p-${hi + 1}-${d}','${id}','${ymd(day)}','done',${h.target},${h.target},'${esc(h.unit)}','${iso(day)}',0);`
    );
  }
});

// Stop the app re-seeding its two starter habits over the top of this.
sql.push(
  `INSERT OR REPLACE INTO metadata (key,value,updatedAt) VALUES ('default_habits_created','true','${iso(today)}');`
);
sql.push('COMMIT;');

execFileSync('sqlite3', [dbPath], { input: sql.join('\n'), stdio: ['pipe', 'inherit', 'inherit'] });

const count = execFileSync('sqlite3', [dbPath, 'SELECT COUNT(*) FROM habit_progress;'], {
  encoding: 'utf8',
}).trim();

console.log(`Seeded ${habits.length} habits and ${count} completions into ${dbPath}`);
