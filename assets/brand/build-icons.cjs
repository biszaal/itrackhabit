/**
 * Generates iTrackHabit app icon assets from the two-tone monogram mark.
 * Run:  npm i sharp  &&  node frontend/assets/brand/build-icons.cjs
 * (or)  NODE_PATH=/path/to/node_modules node frontend/assets/brand/build-icons.cjs
 *
 * Design source of truth: ./mark.svg and docs/superpowers/specs/2026-05-21-logo-design.md
 */
const sharp = require('sharp');
const path = require('path');

const OUT = path.resolve(__dirname, '..'); // -> frontend/assets
const C = { indigo: '#6366F1', navy: '#1A2B45', cream: '#FBF6EE', white: '#FFFFFF' };

// Mark in local 100x100 units: dot (50,24) r10, stem 16x40 @ (42,42) rx8.
// Visual bbox center = (50,48), height = 68.
function markGroup(cx, cy, k, dot, stem) {
  return (
    `<g transform="translate(${cx},${cy}) scale(${k}) translate(-50,-48)">` +
    `<circle cx="50" cy="24" r="10" fill="${dot}"/>` +
    `<rect x="42" y="42" width="16" height="40" rx="8" fill="${stem}"/>` +
    `</g>`
  );
}

// Square canvas; bg=null -> transparent; markFrac = mark height as fraction of canvas.
function canvasSVG(size, bg, markFrac, dot, stem) {
  const k = (size * markFrac) / 68;
  const bgRect = bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    bgRect + markGroup(size / 2, size / 2, k, dot, stem) + `</svg>`
  );
}

async function render(svg, outSize, file) {
  await sharp(Buffer.from(svg)).resize(outSize, outSize).png().toFile(path.join(OUT, file));
  console.log('wrote', file, `${outSize}x${outSize}`);
}

(async () => {
  // App icon — Light hero: full-bleed cream square (iOS masks corners).
  await render(canvasSVG(1024, C.cream, 0.5, C.indigo, C.navy), 1024, 'icon.png');
  // Android adaptive foreground — transparent, mark inside the 66% safe zone.
  await render(canvasSVG(1024, null, 0.46, C.indigo, C.navy), 1024, 'adaptive-icon.png');
  // Splash — transparent mark centered (cream background set in app.json).
  await render(canvasSVG(1024, null, 0.4, C.indigo, C.navy), 1024, 'splash-icon.png');
  // Favicon — cream square, composed large then downscaled for crisp edges.
  await render(canvasSVG(256, C.cream, 0.6, C.indigo, C.navy), 48, 'favicon.png');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
