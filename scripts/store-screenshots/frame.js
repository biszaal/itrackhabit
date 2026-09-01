/**
 * Composites a raw simulator capture into an App Store marketing screenshot.
 *
 * The listing screenshots used to be assembled by hand, which is how they
 * drifted: headlines ended up over the wrong screen, a "Synced" badge appeared
 * for a feature the app does not have, and one size kept a set from an older
 * design. Everything here is declared in `shots.js` instead, so the caption and
 * the screen it sits above cannot disagree.
 *
 * Rendering goes through headless Chrome rather than an image library because
 * the frames are mostly type and shadow, which CSS gets right for free.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// The layout was authored against a 1284pt-wide canvas; every other size is the
// same design scaled, so proportions hold across iPhone and iPad slots.
const BASE_W = 1284;

const PALETTE = {
  ink: '#1C1F2E',
  ink2: '#525866',
  sage: '#7C9B7E',
  bezel: '#141824',
};

function html(shot, canvas, screenshotDataUri, srcSize) {
  const k = canvas.width / BASE_W;
  const px = (n) => `${(n * k).toFixed(2)}px`;
  // Type does not scale linearly with canvas width: the iPad canvas is far
  // wider, and headline sizes taken straight from the phone read as shouting.
  const ts = canvas.typeScale ?? 1;
  const tx = (n) => px(n * ts);

  // The device sits in the lower half and bleeds off the bottom edge, so the
  // caption always has the top third to itself no matter how tall the canvas is.
  // `aspect` comes from the capture, not the canvas: an iPad screen is far
  // squarer than a phone one and would otherwise be stretched to fit.
  const deviceW = canvas.width * (canvas.deviceWidth ?? 0.67);
  const deviceH = deviceW * canvas.aspect;
  const bezel = deviceW * 0.017;
  const centred = canvas.variant === 'tablet';

  // Cover the device's inner area with whatever is left after the top trim.
  const boxW = deviceW - 2 * bezel;
  const boxH = deviceH - 2 * bezel;
  const crop =
    typeof shot.cropTop === 'object'
      ? shot.cropTop[canvas.variant] ?? 0
      : shot.cropTop ?? 0;
  const imgScale = Math.max(boxW / srcSize.width, boxH / (srcSize.height - crop));

  // Badge positions are canvas-relative, and the device sits in a different
  // place on the far wider tablet canvas, where they land on top of content.
  // The centred copy carries that layout on its own.
  const badges = (centred ? [] : shot.badges ?? [])
    .map(
      (b) => `
      <div class="badge" style="left:${b.x * 100}%; top:${b.y * 100}%;">
        <span class="dot" style="background:${b.color ?? PALETTE.sage}"></span>${b.label}
      </div>`
    )
    .join('');

  return `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:${canvas.width}px; height:${canvas.height}px;
    position:relative; overflow:hidden;
    font-family:'Inter',-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;
    background:#FAFBF8;
  }
  /* Soft sage wash in the corners, matching the existing listing art. */
  .wash-a, .wash-b { position:absolute; border-radius:50%; }
  .wash-a {
    width:${px(1500)}; height:${px(1500)};
    right:${px(-500)}; top:${px(-450)};
    background:radial-gradient(circle, rgba(124,155,126,0.16) 0%, rgba(124,155,126,0) 70%);
  }
  .wash-b {
    width:${px(1700)}; height:${px(1700)};
    left:${px(-700)}; bottom:${px(-600)};
    background:radial-gradient(circle, rgba(124,155,126,0.13) 0%, rgba(124,155,126,0) 70%);
  }
  .copy {
    position:absolute; left:${px(90)}; right:${px(90)};
    top:${px(canvas.copyTop ?? 200)};
    ${centred ? 'text-align:center;' : ''}
  }
  .eyebrow {
    font-size:${tx(26)}; font-weight:700; letter-spacing:${tx(4.2)};
    text-transform:uppercase; color:${PALETTE.sage};
    margin-bottom:${tx(28)};
  }
  h1 {
    font-size:${tx(118)}; font-weight:800; line-height:1.04;
    letter-spacing:${tx(-3.4)}; color:${PALETTE.ink};
  }
  .sub {
    margin-top:${tx(38)}; font-size:${tx(37)}; font-weight:400;
    line-height:1.35; color:${PALETTE.ink2};
    max-width:${tx(950)};
    ${centred ? 'margin-left:auto; margin-right:auto;' : ''}
  }
  .device {
    position:absolute;
    left:50%; top:${px(canvas.deviceTop ?? 1020)};
    width:${deviceW}px; height:${deviceH}px;
    margin-left:${-deviceW / 2}px;
    transform:rotate(${shot.rotate ?? 0}deg);
    background:${PALETTE.bezel};
    border-radius:${deviceW * 0.092}px;
    padding:${bezel}px;
    box-shadow:0 ${px(60)} ${px(120)} rgba(28,31,46,0.22),
               0 ${px(14)} ${px(34)} rgba(28,31,46,0.12);
  }
  .screen {
    width:100%; height:100%; overflow:hidden;
    border-radius:${deviceW * 0.078}px;
  }
  /* Sized so the capture still covers the screen after cropTop is trimmed off
     the top, rather than leaving a gap at the bottom. */
  .screen img {
    display:block;
    width:${srcSize.width * imgScale}px;
    height:${srcSize.height * imgScale}px;
    margin-top:${-crop * imgScale}px;
    margin-left:${(boxW - srcSize.width * imgScale) / 2}px;
  }
  .badge {
    position:absolute; transform:translate(-50%,-50%);
    display:flex; align-items:center; gap:${px(16)};
    background:#fff; color:${PALETTE.ink};
    font-size:${px(30)}; font-weight:700; letter-spacing:${px(-0.4)};
    padding:${px(22)} ${px(34)};
    border-radius:${px(999)};
    box-shadow:0 ${px(18)} ${px(44)} rgba(28,31,46,0.16);
    white-space:pre-line; line-height:1.2;
  }
  .dot { width:${px(15)}; height:${px(15)}; border-radius:50%; flex:none; }
</style></head>
<body>
  <div class="wash-a"></div><div class="wash-b"></div>
  <div class="copy">
    <div class="eyebrow">${shot.eyebrow}</div>
    <h1>${shot.headline.join('<br>')}</h1>
    <div class="sub">${shot.sub}</div>
  </div>
  <div class="device"><div class="screen"><img src="${screenshotDataUri}"></div></div>
  ${badges}
</body></html>`;
}

/**
 * @param shot     entry from shots.js
 * @param canvas   { width, height, aspect } of the target App Store slot
 * @param srcPng   raw simulator capture to place in the device frame
 * @param outPng   destination
 */
function render(shot, canvas, srcPng, outPng, tmpDir) {
  const dataUri =
    'data:image/png;base64,' + fs.readFileSync(srcPng).toString('base64');

  // Natural size of the capture, so `cropTop` can be expressed in source pixels.
  const info = execFileSync('sips', ['-g', 'pixelHeight', '-g', 'pixelWidth', srcPng], {
    encoding: 'utf8',
  });
  const srcSize = {
    height: Number(/pixelHeight:\s*(\d+)/.exec(info)[1]),
    width: Number(/pixelWidth:\s*(\d+)/.exec(info)[1]),
  };

  const page = path.join(tmpDir, `${path.basename(outPng, '.png')}.html`);
  fs.writeFileSync(page, html(shot, canvas, dataUri, srcSize));

  execFileSync(
    CHROME,
    [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${canvas.width},${canvas.height}`,
      `--screenshot=${outPng}`,
      // Webfonts need a moment; Chrome screenshots as soon as load fires.
      '--virtual-time-budget=4000',
      `file://${page}`,
    ],
    { stdio: 'pipe' }
  );

  return outPng;
}

module.exports = { render };
