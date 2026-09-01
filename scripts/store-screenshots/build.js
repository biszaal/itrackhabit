#!/usr/bin/env node
/**
 * Renders every App Store screenshot slot from the raw simulator captures.
 *
 *   node scripts/store-screenshots/build.js
 *
 * Reads captures from scripts/store-screenshots/captures/{phone,tablet}/<screen>.png
 * (produced by capture.js) and writes the framed results straight into
 * store/apple/screenshot/en-GB/, which is what store.json points at.
 *
 * Re-running is safe: it overwrites in place, so refreshing the listing after a
 * UI change is one command rather than an afternoon in a design tool.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const { render } = require('./frame');
const shots = require('./shots');

const ROOT = path.resolve(__dirname, '../..');
const CAPTURES = path.join(__dirname, 'captures');
const OUT = path.join(ROOT, 'store/apple/screenshot/en-GB');

// Apple's slots. 6.9" is the one the store shows most prominently; 6.5" is the
// same art at the older aspect. Both come from the Pro Max captures.
const TARGETS = [
  {
    dir: 'APP_IPHONE_67',
    width: 1320,
    height: 2868,
    source: 'phone',
    aspect: 2868 / 1320,
    variant: 'phone',
    suffix: '1320x2868',
  },
  {
    dir: 'APP_IPHONE_65',
    width: 1284,
    height: 2778,
    source: 'phone',
    aspect: 2868 / 1320,
    variant: 'phone',
    suffix: '1284x2778',
  },
  {
    dir: 'APP_IPAD_PRO_3GEN_129',
    width: 2048,
    height: 2732,
    source: 'tablet',
    aspect: 2732 / 2048,
    variant: 'tablet',
    // An iPad screen is much squarer, so it needs to be wider on the canvas to
    // carry the same visual weight, and only just bleeds off the bottom edge.
    deviceWidth: 0.734,
    deviceTop: 492,
    copyTop: 137,
    typeScale: 0.7,
    suffix: '2048x2732',
  },
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'store-shots-'));
let made = 0;
const missing = [];

for (const target of TARGETS) {
  const outDir = path.join(OUT, target.dir);
  fs.mkdirSync(outDir, { recursive: true });

  shots.forEach((shot, i) => {
    const src = path.join(CAPTURES, target.source, `${shot.screen}.png`);
    if (!fs.existsSync(src)) {
      missing.push(path.relative(ROOT, src));
      return;
    }

    const n = String(i + 1).padStart(2, '0');
    const out = path.join(
      outDir,
      `itrackhabit-${n}-${shot.slug}-${target.suffix}.png`
    );

    render(shot, target, src, out, tmp);
    made++;
    console.log(`  ${path.relative(ROOT, out)}`);
  });
}

if (missing.length) {
  console.error('\nMissing captures:');
  for (const m of new Set(missing)) console.error(`  ${m}`);
  console.error('\nCapture the screens first (see README.md).');
  process.exit(1);
}

// Rewrite store.json to point at exactly what was just rendered, and drop any
// file that is no longer referenced. The listing previously kept a set from an
// older design purely because nothing ever pruned it.
const storePath = path.join(ROOT, 'store.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
const slots = store.apple.info['en-GB'].screenshots;

let removed = 0;
for (const target of TARGETS) {
  const outDir = path.join(OUT, target.dir);
  const wanted = shots.map(
    (shot, i) =>
      `itrackhabit-${String(i + 1).padStart(2, '0')}-${shot.slug}-${target.suffix}.png`
  );

  for (const file of fs.readdirSync(outDir)) {
    if (!wanted.includes(file)) {
      fs.unlinkSync(path.join(outDir, file));
      console.log(`  removed stale ${target.dir}/${file}`);
      removed++;
    }
  }

  slots[target.dir] = wanted.map(
    (f) => `store/apple/screenshot/en-GB/${target.dir}/${f}`
  );
}

fs.writeFileSync(storePath, JSON.stringify(store, null, 2) + '\n');

console.log(`\nRendered ${made} screenshots, removed ${removed} stale files.`);
console.log('store.json updated. Review, then: npx eas metadata:push');
