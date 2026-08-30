#!/usr/bin/env node
/**
 * Resize + re-encode a hero photograph to the sizes the site expects.
 *
 *   node scripts/optimise-hero.js <source-image> <season>
 *   node scripts/optimise-hero.js ~/sky.jpg summer
 *
 * Writes public/images/hero/hero-<season>.jpg and .webp, both 1600px wide,
 * quality ~0.72, and prints the final byte sizes.
 *
 * No new dependencies: the encoding is done by Chromium's own canvas
 * (toDataURL supports both image/jpeg and image/webp), driven through the
 * Playwright that is already available in this environment.
 */
const fs = require('fs');
const path = require('path');

const WIDTH = 1600;
const QUALITY = 0.72;
const SEASONS = ['spring', 'summer', 'fall', 'winter'];
const OUT_DIR = path.join(__dirname, '..', 'public', 'images', 'hero');

function findPlaywright() {
  for (const p of ['/opt/node22/lib/node_modules/playwright', 'playwright']) {
    try { return require(p); } catch (e) { /* try next */ }
  }
  throw new Error('playwright not found — install it or run this where it is available');
}

async function main() {
  const [src, season] = process.argv.slice(2);
  if (!src || !season) {
    console.error('usage: node scripts/optimise-hero.js <source-image> <season>');
    console.error('       season is one of: ' + SEASONS.join(', '));
    process.exit(1);
  }
  if (!SEASONS.includes(season)) {
    console.error(`unknown season "${season}" — expected one of: ${SEASONS.join(', ')}`);
    process.exit(1);
  }
  if (!fs.existsSync(src)) {
    console.error('source image not found:', src);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { chromium } = findPlaywright();
  const browser = await chromium.launch({
    executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
  });
  const page = await browser.newPage();

  const b64 = fs.readFileSync(src).toString('base64');
  const ext = path.extname(src).slice(1).toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const out = await page.evaluate(async ({ dataUrl, width, quality }) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl; });
    const scale = Math.min(1, width / img.naturalWidth);   // never upscale
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    return {
      w, h,
      srcW: img.naturalWidth, srcH: img.naturalHeight,
      jpeg: c.toDataURL('image/jpeg', quality),
      webp: c.toDataURL('image/webp', quality),
    };
  }, { dataUrl: `data:${mime};base64,${b64}`, width: WIDTH, quality: QUALITY });

  await browser.close();

  const write = (dataUrl, file) => {
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    fs.writeFileSync(file, buf);
    return buf.length;
  };
  const jpgPath = path.join(OUT_DIR, `hero-${season}.jpg`);
  const webpPath = path.join(OUT_DIR, `hero-${season}.webp`);
  const jpgSize = write(out.jpeg, jpgPath);
  const webpSize = write(out.webp, webpPath);

  const kb = n => (n / 1024).toFixed(1) + ' KB';
  console.log(`source : ${out.srcW}x${out.srcH}`);
  console.log(`output : ${out.w}x${out.h}  (quality ${QUALITY})`);
  console.log(`  ${path.relative(process.cwd(), jpgPath)}  ${kb(jpgSize)}  ${jpgSize <= 200 * 1024 ? 'OK (<200KB)' : 'OVER 200KB — lower quality or width'}`);
  console.log(`  ${path.relative(process.cwd(), webpPath)}  ${kb(webpSize)}  (${Math.round((1 - webpSize / jpgSize) * 100)}% smaller than the jpg)`);
}

main().catch(e => { console.error(e); process.exit(1); });
