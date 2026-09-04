#!/usr/bin/env node
/**
 * Builds the two round card icons.
 *
 *   node scripts/build-round-icons.js
 *
 * Writes public/fall-icon.png and public/moon-icon.png — 256x256, circular,
 * transparent outside the circle.
 *
 * These were specified as already existing in public/. They did not, so they
 * are cut here from artwork the repo already ships: the autumn river for the
 * fall icon, the moon out of the haunted house for the Halloween one. Both
 * are decorative and marked aria-hidden wherever they are used, so swapping
 * either PNG for a different one needs no markup change.
 *
 * Chromium's canvas does the crop, the circular clip and the PNG encode, the
 * same approach as build-backdrop.js — no new dependency.
 */
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'public');
const SIZE = 256;

/* name, source, crop as fractions of the source {x,y,w,h} — square crops so
   the circle is not an ellipse. */
const ICONS = [
  { name: 'fall-icon',
    src: path.join(OUT, 'images', 'seasonal', 'autumn-river.jpg'),
    crop: { x: 0.60, y: 0.02, w: 0.40, h: 0.71 } },   // the red maple
  { name: 'moon-icon',
    src: path.join(OUT, 'images', 'halloween', 'haunted-house.jpg'),
    crop: { x: 0.545, y: 0.055, w: 0.225, h: 0.238 } }, // the moon
];

function findPlaywright() {
  for (const p of ['/opt/node22/lib/node_modules/playwright', 'playwright']) {
    try { return require(p); } catch (e) { /* next */ }
  }
  throw new Error('playwright not found');
}

(async () => {
  const { chromium } = findPlaywright();
  const browser = await chromium.launch({
    executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
  });
  const page = await browser.newPage();

  for (const ic of ICONS) {
    if (!fs.existsSync(ic.src)) { console.error('missing source:', ic.src); process.exitCode = 1; continue; }
    const dataUrl = 'data:image/jpeg;base64,' + fs.readFileSync(ic.src).toString('base64');
    const out = await page.evaluate(async ({ dataUrl, crop, size }) => {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl; });
      const sx = Math.round(img.naturalWidth * crop.x), sy = Math.round(img.naturalHeight * crop.y);
      let sw = Math.round(img.naturalWidth * crop.w), sh = Math.round(img.naturalHeight * crop.h);
      const side = Math.min(sw, sh);                    // square, so the circle is round
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      /* Clip first, draw second: everything outside the circle stays at
         alpha 0 rather than being painted and then masked. */
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      return { png: c.toDataURL('image/png'), srcW: img.naturalWidth, srcH: img.naturalHeight, side };
    }, { dataUrl, crop: ic.crop, size: SIZE });

    const buf = Buffer.from(out.png.split(',')[1], 'base64');
    const file = path.join(OUT, ic.name + '.png');
    fs.writeFileSync(file, buf);
    console.log(`  ${ic.name.padEnd(12)} ${SIZE}x${SIZE}  ${(buf.length / 1024).toFixed(1)} KB` +
                `   (cut ${out.side}px square from ${out.srcW}x${out.srcH})`);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
