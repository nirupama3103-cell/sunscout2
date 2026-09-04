#!/usr/bin/env node
/**
 * Builds the two page-backdrop assets the home, Local Table and DIY pages
 * share, from the full-size original.
 *
 *   node scripts/build-backdrop.js <source.jpg>
 *
 * Writes public/images/halloween/haunted-house{,-tall}.{webp,jpg} and prints
 * the byte weight of each, because a full-page backdrop is the single
 * heaviest thing on the page and shipping it un-measured is how a phone
 * ends up downloading a megabyte to look at a filter bar.
 *
 * Two assets, not one:
 *   wide  a crop of the upper composition (moon, roofline, lit windows,
 *         porch). A desktop viewport is landscape; `cover` on the full 2:3
 *         original would scale it to twice the viewport height and show a
 *         thin band, so the crop is done here rather than by the browser.
 *   tall  the whole composition including the pumpkins along the path,
 *         which is what a phone's portrait viewport can actually show.
 *
 * Encoding is Chromium's own canvas (toDataURL does webp and jpeg), driven
 * through the Playwright already in this environment — no new dependency,
 * same approach as scripts/optimise-hero.js.
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, "..", "public", "images", "seasonal");
const QUALITY = 0.62;
const VARIANTS = [
  /* name, source crop as fractions {x,y,w,h}, output width.

     The source is a 2048x2048 square. A page backdrop is seen through a
     heavy scrim at the edges of a landscape viewport, so the wide variant
     takes a letterbox band through the middle — blue sky and the red maple
     at the top, the bridge and the water below. The tall variant keeps the
     maple and the river for a portrait phone, where a letterbox band would
     show almost nothing. */
  { name: 'autumn-river',      crop: { x: 0,    y: 0.06, w: 1,    h: 0.56 }, width: 1280 },
  { name: 'autumn-river-tall', crop: { x: 0.16, y: 0.02, w: 0.84, h: 0.78 }, width: 620  },
];

function findPlaywright() {
  for (const p of ['/opt/node22/lib/node_modules/playwright', 'playwright']) {
    try { return require(p); } catch (e) { /* next */ }
  }
  throw new Error('playwright not found');
}

(async () => {
  const src = process.argv[2];
  if (!src || !fs.existsSync(src)) {
    console.error('usage: node scripts/build-backdrop.js <source-image>');
    process.exit(1);
  }
  const { chromium } = findPlaywright();
  const browser = await chromium.launch({
    executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
  });
  const page = await browser.newPage();
  const ext = path.extname(src).slice(1).toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const dataUrl = `data:${mime};base64,` + fs.readFileSync(src).toString('base64');

  fs.mkdirSync(OUT, { recursive: true });
  const srcKb = fs.statSync(src).size / 1024;
  console.log(`source: ${src}  ${srcKb.toFixed(1)} KB`);

  let total = 0;
  for (const v of VARIANTS) {
    const out = await page.evaluate(async ({ dataUrl, crop, width, quality }) => {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl; });
      const sx = Math.round(img.naturalWidth * crop.x), sy = Math.round(img.naturalHeight * crop.y);
      const sw = Math.round(img.naturalWidth * crop.w), sh = Math.round(img.naturalHeight * crop.h);
      const scale = Math.min(1, width / sw);              // never upscale
      const w = Math.round(sw * scale), h = Math.round(sh * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      return { w, h, srcW: img.naturalWidth, srcH: img.naturalHeight,
               jpeg: c.toDataURL('image/jpeg', quality), webp: c.toDataURL('image/webp', quality) };
    }, { dataUrl, crop: v.crop, width: v.width, quality: QUALITY });

    const write = (u, f) => { const b = Buffer.from(u.split(',')[1], 'base64');
                              fs.writeFileSync(f, b); return b.length; };
    const j = write(out.jpeg, path.join(OUT, v.name + '.jpg'));
    const w = write(out.webp, path.join(OUT, v.name + '.webp'));
    total += w;                                            // webp is what most browsers take
    console.log(`  ${v.name.padEnd(20)} ${out.w}x${out.h}  ` +
                `jpg ${(j / 1024).toFixed(1)} KB   webp ${(w / 1024).toFixed(1)} KB` +
                `   (${Math.round((1 - w / j) * 100)}% smaller)`);
  }
  await browser.close();
  console.log(`\nA visitor downloads ONE of these: ` +
              `${(total / 2 / 1024).toFixed(0)} KB average as webp.`);
})().catch(e => { console.error(e); process.exit(1); });
