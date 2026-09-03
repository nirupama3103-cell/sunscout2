#!/usr/bin/env node
/**
 * Turns the two supplied header images into assets the site can actually use.
 *
 *   node scripts/prepare-header-art.js <leaves.jpg> <food.jpg>
 *
 * LEAVES — the paper-cut autumn border arrives on a white rectangle, which is
 * useless over a dark hero. The near-white background is keyed out to alpha
 * so the leaves can hang over any ground. The key is on SATURATION as well
 * as lightness: the background is neutral and the leaves are not, so a
 * lightness-only key would eat the pale yellow ones.
 *
 * FOOD — the banner carries someone else's headline ("Delicious Special
 * Food"), a Lorem ipsum block, an ORDER NOW button and a search-overlay
 * button baked into the pixels. None of that can appear on this site, so
 * only the text-free photographic region is cropped out.
 *
 * Encoding is Chromium's own canvas, same as the other image scripts here.
 * No new dependency.
 */
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'public', 'images', 'header');

function findPlaywright() {
  for (const p of ['/opt/node22/lib/node_modules/playwright', 'playwright']) {
    try { return require(p); } catch (e) {}
  }
  throw new Error('playwright not found');
}

(async () => {
  const [leaves, food] = process.argv.slice(2);
  if (!leaves || !food) {
    console.error('usage: node scripts/prepare-header-art.js <leaves.jpg> <food.jpg>');
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const { chromium } = findPlaywright();
  const browser = await chromium.launch({
    executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
  const page = await browser.newPage();
  const dataUrl = f => 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64');
  const write = (u, f) => { const b = Buffer.from(u.split(',')[1], 'base64');
                            fs.writeFileSync(f, b); return b.length; };
  const kb = n => (n / 1024).toFixed(1) + ' KB';

  /* ── leaves: flood-fill the background away ────────────────────────────
     A threshold key does not work here. The art is paper-cut, so every leaf
     carries a deliberate white stroke, and the JPEG adds a bright halo
     around each one: keying "bright and neutral" everywhere eats the strokes
     and still leaves a milky band where the halos overlap.

     A flood fill from the outside does. The background is one connected
     region reachable from the bottom and lower sides; the white strokes are
     islands inside leaves and are never reached. */
  const lv = await page.evaluate(async ({ d }) => {
    const img = new Image();
    await new Promise((r, j) => { img.onload = r; img.onerror = j; img.src = d; });
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    const im = x.getImageData(0, 0, c.width, c.height), p = im.data;
    const W = c.width, H = c.height;

    const isBg = (i) => {
      const r = p[i], g = p[i + 1], b = p[i + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      return sat < 0.22 && max > 178;          // neutral and light
    };

    const seen = new Uint8Array(W * H);
    const stack = [];
    /* Seed from the bottom edge and from the lower half of both sides. The
       top edge is solid leaves, so it is never seeded. */
    for (let px = 0; px < W; px++) { const q = (H - 1) * W + px; if (isBg(q * 4)) { stack.push(q); seen[q] = 1; } }
    for (let py = Math.floor(H * 0.35); py < H; py++) {
      for (const px of [0, W - 1]) { const q = py * W + px; if (!seen[q] && isBg(q * 4)) { stack.push(q); seen[q] = 1; } }
    }
    while (stack.length) {
      const q = stack.pop();
      const py = (q / W) | 0, px = q - py * W;
      p[q * 4 + 3] = 0;
      const nb = [];
      if (px > 0) nb.push(q - 1);
      if (px < W - 1) nb.push(q + 1);
      if (py > 0) nb.push(q - W);
      if (py < H - 1) nb.push(q + W);
      for (const n of nb) if (!seen[n] && isBg(n * 4)) { seen[n] = 1; stack.push(n); }
    }

    /* Enclosed pockets — background surrounded by leaves — are unreachable
       from outside, so the fill leaves them as haze. A second pass clears a
       remaining background pixel only when a 7x7 window around it is mostly
       background too: a wide pocket goes, a 2px paper-cut stroke does not.
       Then the fill is re-run from the new holes so pockets clear fully. */
    for (let py = 3; py < H - 3; py++) {
      for (let px = 3; px < W - 3; px++) {
        const q = py * W + px;
        if (!p[q * 4 + 3] || !isBg(q * 4)) continue;
        let n = 0;
        for (let dy = -3; dy <= 3; dy += 1) for (let dx = -3; dx <= 3; dx += 1)
          if (isBg((q + dy * W + dx) * 4)) n++;
        if (n >= 40) { p[q * 4 + 3] = 0; seen[q] = 1; stack.push(q); }
      }
    }
    while (stack.length) {
      const q = stack.pop();
      const py = (q / W) | 0, px = q - py * W;
      p[q * 4 + 3] = 0;
      const nb = [];
      if (px > 0) nb.push(q - 1);
      if (px < W - 1) nb.push(q + 1);
      if (py > 0) nb.push(q - W);
      if (py < H - 1) nb.push(q + W);
      for (const n of nb) if (!seen[n] && isBg(n * 4)) { seen[n] = 1; stack.push(n); }
    }

    /* Feather: any surviving pixel touching a hole loses alpha in proportion
       to how many of its neighbours went, which softens the cut edge without
       a blur pass over the whole image. */
    const a0 = new Uint8ClampedArray(W * H);
    for (let i = 0, q = 0; q < W * H; q++, i += 4) a0[q] = p[i + 3];
    for (let py = 1; py < H - 1; py++) {
      for (let px = 1; px < W - 1; px++) {
        const q = py * W + px;
        if (!a0[q]) continue;
        let clear = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
          if (!a0[q + dy * W + dx]) clear++;
        if (clear) p[q * 4 + 3] = Math.round(255 * (1 - clear / 12));
      }
    }
    x.putImageData(im, 0, 0);
    return { w: W, h: H, png: c.toDataURL('image/png'), webp: c.toDataURL('image/webp', 0.88) };
  }, { d: dataUrl(leaves) });

  const lp = write(lv.png,  path.join(OUT, 'autumn-leaves.png'));
  const lw = write(lv.webp, path.join(OUT, 'autumn-leaves.webp'));
  console.log(`autumn-leaves  ${lv.w}x${lv.h}  png ${kb(lp)}  webp ${kb(lw)}  (alpha keyed)`);

  /* ── food: crop to the region with no foreign text and no overlay ─────── */
  const fd = await page.evaluate(async ({ d, crop, width, q }) => {
    const img = new Image();
    await new Promise((r, j) => { img.onload = r; img.onerror = j; img.src = d; });
    const sx = Math.round(img.naturalWidth * crop.x), sy = Math.round(img.naturalHeight * crop.y);
    const sw = Math.round(img.naturalWidth * crop.w), sh = Math.round(img.naturalHeight * crop.h);
    const scale = Math.min(1, width / sw);
    const w = Math.round(sw * scale), h = Math.round(sh * scale);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    return { w, h, srcW: img.naturalWidth, jpeg: c.toDataURL('image/jpeg', q),
             webp: c.toDataURL('image/webp', q) };
  }, { d: dataUrl(food),
       /* right of the headline panel, above the ORDER NOW row: photographs
          only, no lettering, no overlay button */
       crop: { x: 0.455, y: 0.02, w: 0.505, h: 0.79 },
       width: 1200, q: 0.74 });
  const fj = write(fd.jpeg, path.join(OUT, 'local-table-food.jpg'));
  const fw = write(fd.webp, path.join(OUT, 'local-table-food.webp'));
  console.log(`local-table-food  ${fd.w}x${fd.h}  jpg ${kb(fj)}  webp ${kb(fw)}`);
  if (fd.w < 1200) {
    console.warn(`WARNING: only ${fd.w}px wide. The source banner is ${fd.srcW}px in total,`);
    console.warn(`         so a full-bleed header will look soft above ~${fd.w}px. Never upscaled.`);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
