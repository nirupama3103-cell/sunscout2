#!/usr/bin/env node
/**
 * Builds the fall and winter hero skies.
 *
 *   node scripts/build-season-heroes.js
 *
 * Writes public/images/hero/hero-{fall,winter}.{jpg,webp}.
 *
 * Why grade rather than source new photographs: the spring/summer hero is a
 * soft sunset sky with no subject in it, which is what makes it safe behind
 * a headline — there is no edge for text to land on and the luminance
 * barely moves across the frame. A stock autumn scene with branches and a
 * horizon would put hard contrast under the type. So both new seasons are
 * the same sky, graded: fall warmer and deeper, winter cooler and flatter.
 *
 * Both stay LIGHT on purpose. The hero sets dark text on a light ground,
 * and a dark hero photo would mean re-theming the whole block.
 *
 * Chromium's canvas does the pixel work and the encode, same approach as
 * build-backdrop.js and build-round-icons.js — no new dependency.
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'images', 'hero');
const SRC = path.join(DIR, 'hero-summer.jpg');
const QUALITY = 0.72;

/* Per-channel gain, then a lift toward a tint colour. Kept gentle: the point
   is a season's cast, not a filter. */
const GRADES = {
  fall:   { gain: [1.06, 0.97, 0.84], tint: [255, 176,  92], tintAmt: 0.14, flatten: 0.06 },
  winter: { gain: [0.90, 0.95, 1.06], tint: [214, 228, 240], tintAmt: 0.22, flatten: 0.20 },
};

function findPlaywright() {
  for (const p of ['/opt/node22/lib/node_modules/playwright', 'playwright']) {
    try { return require(p); } catch (e) { /* next */ }
  }
  throw new Error('playwright not found');
}

(async () => {
  if (!fs.existsSync(SRC)) { console.error('missing source:', SRC); process.exit(1); }
  const { chromium } = findPlaywright();
  const browser = await chromium.launch({
    executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
  const page = await browser.newPage();
  const dataUrl = 'data:image/jpeg;base64,' + fs.readFileSync(SRC).toString('base64');

  for (const [season, g] of Object.entries(GRADES)) {
    const out = await page.evaluate(async ({ dataUrl, g, quality }) => {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl; });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      const p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        for (let k = 0; k < 3; k++) {
          let v = p[i + k] * g.gain[k];
          v = v + (g.tint[k] - v) * g.tintAmt;               // cast
          v = 128 + (v - 128) * (1 - g.flatten) + 128 * g.flatten * 0.12; // flatten + lift
          p[i + k] = v < 0 ? 0 : v > 255 ? 255 : v;
        }
      }
      ctx.putImageData(d, 0, 0);
      /* Mean luminance is reported so a grade that drifts dark is caught
         here rather than by a contrast failure on the page. */
      let sum = 0;
      for (let i = 0; i < p.length; i += 4)
        sum += 0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];
      return { w: c.width, h: c.height, mean: sum / (p.length / 4),
               jpeg: c.toDataURL('image/jpeg', quality),
               webp: c.toDataURL('image/webp', quality) };
    }, { dataUrl, g, quality: QUALITY });

    const write = (u, f) => { const b = Buffer.from(u.split(',')[1], 'base64');
                              fs.writeFileSync(f, b); return b.length; };
    const j = write(out.jpeg, path.join(DIR, `hero-${season}.jpg`));
    const w = write(out.webp, path.join(DIR, `hero-${season}.webp`));
    console.log(`  hero-${season.padEnd(7)} ${out.w}x${out.h}  ` +
                `jpg ${(j / 1024).toFixed(1)} KB   webp ${(w / 1024).toFixed(1)} KB   ` +
                `mean luminance ${out.mean.toFixed(0)}/255`);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
