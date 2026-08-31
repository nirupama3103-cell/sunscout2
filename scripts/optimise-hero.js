#!/usr/bin/env node
/**
 * Resize + re-encode a hero photograph to the sizes the site expects.
 *
 *   node scripts/optimise-hero.js <source-image> <season|name> [outDir]
 *   node scripts/optimise-hero.js ~/sky.jpg summer
 *   node scripts/optimise-hero.js ~/moon.jpg halloween-hero public/images/seasons
 *
 * A season name writes public/images/hero/hero-<season>.{jpg,webp}; any other
 * name writes <outDir>/<name>.{jpg,webp} (outDir defaults to public/images).
 * Both are 1600px wide, quality ~0.72, and the final byte sizes are printed.
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
  const [src, name, outDirArg] = process.argv.slice(2);
  if (!src || !name) {
    console.error('usage: node scripts/optimise-hero.js <source-image> <season|name> [outDir]');
    console.error('       seasons: ' + SEASONS.join(', ') + '  (any other name is used verbatim)');
    process.exit(1);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(name)) {
    console.error(`invalid output name "${name}" — letters, digits and hyphens only`);
    process.exit(1);
  }
  if (!fs.existsSync(src)) {
    console.error('source image not found:', src);
    process.exit(1);
  }
  /* A season keeps the hero-<season> convention applySeason() looks for;
     anything else is a one-off asset and lands where it is told. */
  const isSeason = SEASONS.includes(name);
  const outDir = isSeason ? OUT_DIR
    : path.resolve(outDirArg || path.join(__dirname, '..', 'public', 'images'));
  const base = isSeason ? `hero-${name}` : name;
  fs.mkdirSync(outDir, { recursive: true });

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
  const jpgPath = path.join(outDir, `${base}.jpg`);
  const webpPath = path.join(outDir, `${base}.webp`);
  const jpgSize = write(out.jpeg, jpgPath);
  const webpSize = write(out.webp, webpPath);

  const kb = n => (n / 1024).toFixed(1) + ' KB';
  console.log(`source : ${out.srcW}x${out.srcH}`);
  /* Detail cannot be invented: if the source is narrower than the target the
     hero will look soft on a wide desktop, and no amount of re-encoding
     fixes it. Say so loudly at the point the mistake is made. */
  if (out.srcW < WIDTH) {
    console.warn(`WARNING: source is only ${out.srcW}px wide, below the ${WIDTH}px target.`);
    console.warn(`         Never upscaled, so the hero will look soft on displays wider`);
    console.warn(`         than ${out.srcW}px. Re-run with a larger original to sharpen it.`);
  }
  console.log(`output : ${out.w}x${out.h}  (quality ${QUALITY})`);
  console.log(`  ${path.relative(process.cwd(), jpgPath)}  ${kb(jpgSize)}  ${jpgSize <= 200 * 1024 ? 'OK (<200KB)' : 'OVER 200KB — lower quality or width'}`);
  console.log(`  ${path.relative(process.cwd(), webpPath)}  ${kb(webpSize)}  (${Math.round((1 - webpSize / jpgSize) * 100)}% smaller than the jpg)`);
}

main().catch(e => { console.error(e); process.exit(1); });
