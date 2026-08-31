#!/usr/bin/env node
/**
 * Measure real hero text contrast against the scrimmed photograph.
 *
 *   node scripts/check-hero-contrast.js [url]
 *   node scripts/check-hero-contrast.js "http://localhost:8765/?season=summer"
 *
 * Screenshots the hero at desktop and mobile widths, samples the actual
 * rendered pixels immediately behind the top, middle and bottom of the text
 * block, and reports the WCAG contrast ratio against the text colour that
 * is painted there. Run this after dropping a new hero image in — the
 * ratio depends entirely on how bright that particular photograph is.
 *
 * Exit code 1 if any sampled point falls below 4.5:1.
 */
const fs = require('fs');

const URL = process.argv[2] || 'http://localhost:8765/';
const AA = 4.5;

function findPlaywright() {
  for (const p of ['/opt/node22/lib/node_modules/playwright', 'playwright']) {
    try { return require(p); } catch (e) { /* next */ }
  }
  throw new Error('playwright not found');
}

const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const parseRGB = s => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);

(async () => {
  const { chromium } = findPlaywright();
  const browser = await chromium.launch({
    executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
  });
  let failed = false;

  for (const vp of [{ name: 'desktop', width: 1280, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.route('**api.open-meteo.com**', r => r.abort()).catch(() => {});
    await page.route('**/api/**', r => r.abort()).catch(() => {});
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1400);

    // Which elements to sample, and the text colour actually painted on each.
    const targets = await page.evaluate(() => {
      const pick = sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return null;
        return { sel, color: getComputedStyle(el).color, x: r.left + r.width / 2, y: r.top + r.height / 2, top: r.top, bottom: r.bottom };
      };
      return {
        heroOn: (document.querySelector('.hero') || {}).dataset ? document.querySelector('.hero').dataset.heroImg === 'on' : false,
        items: [pick('#heroLine1'), pick('.p-lede'), pick('.p-stat b')].filter(Boolean),
      };
    });

    const shot = await page.screenshot({ clip: await page.evaluate(() => {
      const r = document.querySelector('.hero').getBoundingClientRect();
      return { x: 0, y: Math.max(0, r.top), width: Math.ceil(r.width), height: Math.ceil(Math.min(r.height, window.innerHeight - r.top)) };
    }) });

    // Decode the PNG through the browser so we can read pixels without a decoder dep.
    const px = await page.evaluate(async ({ b64, pts, textLight }) => {
      const img = new Image();
      await new Promise(res => { img.onload = res; img.src = 'data:image/png;base64,' + b64; });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const heroTop = document.querySelector('.hero').getBoundingClientRect().top;
      return pts.map(p => {
        // sample just left of the text's centre, in the gap between glyphs,
        // by averaging a small patch and taking the most common (background) tone
        const sx = Math.max(0, Math.min(c.width - 8, Math.round(p.x)));
        const sy = Math.max(0, Math.min(c.height - 8, Math.round(p.y - heroTop)));
        const d = ctx.getImageData(sx - 3, sy - 3, 7, 7).data;
        const tones = [];
        for (let i = 0; i < d.length; i += 4) tones.push([d[i], d[i + 1], d[i + 2]]);
        tones.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
        // The background is whichever end of the patch is furthest from the
        // glyph colour: darker tones under light text, lighter under dark.
        const i = textLight[pts.indexOf(p)]
          ? Math.floor(tones.length * 0.15)
          : Math.floor(tones.length * 0.85);
        return tones[i];
      });
    }, {
      b64: shot.toString('base64'),
      pts: targets.items,
      textLight: targets.items.map(t => {
        const [r, g, b] = t.color.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 140;
      }),
    });

    console.log(`\n=== ${vp.name} (${vp.width}px) — hero image active: ${targets.heroOn} ===`);
    if (!targets.heroOn) {
      console.log('  NOTE: no hero photograph is loaded, so this is measuring the plain');
      console.log('        gradient fallback. The numbers below say nothing about how the');
      console.log('        real image will perform — add the asset and re-run.');
    }
    const labels = ['top of text block (H1)', 'middle (lede)', 'bottom (stats row)'];
    targets.items.forEach((t, i) => {
      const bg = px[i], fg = parseRGB(t.color);
      const r = ratio(fg, bg);
      const ok = r >= AA;
      if (!ok) failed = true;
      console.log(`  ${labels[i].padEnd(24)} text ${t.color.padEnd(20)} bg rgb(${bg.join(',')})`.padEnd(78) + `${r.toFixed(2)}:1  ${ok ? 'PASS' : 'FAIL (<4.5:1)'}`);
    });
    await page.close();
  }
  await browser.close();
  console.log(failed ? '\nRESULT: at least one sample is below 4.5:1' : '\nRESULT: all sampled points meet 4.5:1');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
