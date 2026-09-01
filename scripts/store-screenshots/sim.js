#!/usr/bin/env node
/**
 * Thin driver for capturing screens off a booted simulator.
 *
 *   node sim.js shot <udid> <out.png>        capture the screen
 *   node sim.js tap  <udid> <x> <y>          tap, in 0..1 screen-relative coords
 *
 * The app has no deep-link routes, so screens are reached by tapping the way a
 * user would. Coordinates are normalised rather than absolute so the same
 * sequence works on the phone and the iPad, whose screens differ in size.
 */

const { execFileSync } = require('child_process');

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: 'utf8', ...opts });

/** Simulator's on-screen window frame, via AppleScript. */
function windowFrame() {
  const script = `
    tell application "System Events" to tell process "Simulator"
      set w to first window
      set {x, y} to position of w
      set {ww, wh} to size of w
      return (x as string) & "," & (y as string) & "," & (ww as string) & "," & (wh as string)
    end tell`;
  const [x, y, w, h] = run('osascript', ['-e', script]).trim().split(',').map(Number);
  return { x, y, w, h };
}

/**
 * The device screen sits below the window's title bar and fills the rest of the
 * window, so the drawable area is derived rather than assumed.
 */
function screenRect(udid) {
  const f = windowFrame();
  const TITLE_BAR = 28;
  return { x: f.x, y: f.y + TITLE_BAR, w: f.w, h: f.h - TITLE_BAR };
}

const [, , cmd, udid, ...rest] = process.argv;

if (cmd === 'shot') {
  run('xcrun', ['simctl', 'io', udid, 'screenshot', '--type=png', rest[0]]);
  console.log(rest[0]);
} else if (cmd === 'tap') {
  const [nx, ny] = rest.map(Number);
  const r = screenRect(udid);
  const px = Math.round(r.x + nx * r.w);
  const py = Math.round(r.y + ny * r.h);
  run('cliclick', [`c:${px},${py}`]);
  console.log(`tapped ${px},${py}`);
} else if (cmd === 'frame') {
  console.log(JSON.stringify(screenRect(udid)));
} else {
  console.error('usage: sim.js shot|tap|frame <udid> ...');
  process.exit(1);
}
