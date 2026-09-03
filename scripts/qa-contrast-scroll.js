#!/usr/bin/env node
/**
 * Contrast at several SCROLL POSITIONS.
 *
 *   python3 -m http.server 8765 --directory public &
 *   node scripts/qa-contrast-scroll.js [url] [width]
 *
 * check-page-contrast.js takes one full-page screenshot, and a full-page
 * screenshot paints a position:fixed backdrop once, at scroll 0. On this page
 * the backdrop IS fixed, so everything below the first viewport gets measured
 * against the flat ground colour instead of against the moon it is actually
 * sitting on. That is precisely the case the design risks getting wrong.
 *
 * So: viewport-sized captures at a series of scroll offsets, measuring only
 * what is on screen at each one. Same glyph-diff method — blank the text,
 * screenshot, diff — so each element is measured on its own pixels.
 */
const URL_ = process.argv[2] || 'http://localhost:8765/seasons/halloween/';
const WIDTH = Number(process.argv[3] || 1440);
const STOPS = 8;                    // scroll positions, evenly spaced
const fs = require('fs');
function findPlaywright() {
  for (const p of ['/opt/node22/lib/node_modules/playwright', 'playwright']) {
    try { return require(p); } catch (e) {}
  }
  throw new Error('playwright not found');
}
const BLANK = `*{color:transparent!important;-webkit-text-fill-color:transparent!important;
  text-decoration-color:transparent!important;caret-color:transparent!important;
  text-shadow:none!important}`;

(async () => {
  const { chromium } = findPlaywright();
  const browser = await chromium.launch({
    executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });
  const origin = new URL(URL_).origin;
  await page.route('**/*', r => r.request().url().startsWith(origin) ? r.continue() : r.abort());
  await page.route('**/api/photos**', r => r.fulfill({
    status: 200, contentType: 'application/json', body: '{"url":"/park.jpg"}' }));
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
  await page.addStyleTag({ content:
    `*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}` });

  const probe = await browser.newPage();
  const setBlank = (on) => page.evaluate(({ on, css }) => {
    let el = document.getElementById('cpc-blank');
    if (on) { if (!el) { el = document.createElement('style'); el.id = 'cpc-blank';
                         el.textContent = css; document.head.appendChild(el); } }
    else if (el) el.remove();
  }, { on, css: BLANK });

  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = 900;
  const offsets = [];
  for (let i = 0; i < STOPS; i++) offsets.push(Math.round(i * (height - vh) / (STOPS - 1)));

  let pass = 0, fail = 0;
  const worstByLabel = new Map();

  async function verify(idx) {
    const box = await page.evaluate((i) => {
      const el = document.querySelector(`[data-cpc="${i}"]`);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      if (b.top < 0 || b.bottom > window.innerHeight) return null;
      return { x: Math.max(0, Math.floor(b.left)), y: Math.max(0, Math.floor(b.top)),
               width: Math.max(1, Math.ceil(b.width)), height: Math.max(1, Math.ceil(b.height)),
               color: getComputedStyle(el).color,
               clipped: (getComputedStyle(el).webkitTextFillColor || '').includes('rgba(0, 0, 0, 0)') };
    }, idx);
    if (!box) return null;
    await setBlank(false);
    const ink1 = (await page.screenshot({ clip: { x: box.x, y: box.y, width: box.width, height: box.height } })).toString('base64');
    await setBlank(true);
    const plate1 = (await page.screenshot({ clip: { x: box.x, y: box.y, width: box.width, height: box.height } })).toString('base64');
    return probe.evaluate(async ({ ink1, plate1, color, clipped }) => {
      const load = async (b64) => { const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + b64; });
        const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0); return c.getContext('2d').getImageData(0, 0, c.width, c.height); };
      const A = await load(ink1), B = await load(plate1);
      const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const ratio = (a, b) => { const [hi, lo] = a > b ? [a, b] : [b, a]; return (hi + 0.05) / (lo + 0.05); };
      const parse = s => (s.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
      let ink = parse(color), best = -1; const idx = [];
      for (let i = 0; i < A.data.length; i += 4) {
        const dl = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i+1] - B.data[i+1]),
                            Math.abs(A.data[i+2] - B.data[i+2]));
        if (dl < 40) continue;
        idx.push(i);
        if (clipped && dl > best) { best = dl; ink = [A.data[i], A.data[i+1], A.data[i+2]]; }
      }
      if (!idx.length) return null;
      const fl = lum(ink[0], ink[1], ink[2]);
      const scored = idx.map(i => ({ r: ratio(fl, lum(B.data[i], B.data[i+1], B.data[i+2])),
                                     p: [B.data[i], B.data[i+1], B.data[i+2]] })).sort((a, b) => a.r - b.r);
      const at = scored[Math.min(scored.length - 1, Math.floor(scored.length * 0.02))];
      return { ratio: at.r, px: at.p };
    }, { ink1, plate1, color: box.color, clipped: box.clipped });
  }

  for (const y of offsets) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(450);
    await setBlank(false);
    const inked = (await page.screenshot()).toString('base64');
    const targets = await page.evaluate(() => {
      /* Stale tags from the previous scroll stop would make verify() clip the
         wrong element — it re-finds by this attribute. */
      document.querySelectorAll('[data-cpc]').forEach(e => e.removeAttribute('data-cpc'));
      const out = [];
      document.querySelectorAll('body *').forEach(el => {
        if (el.getAttribute('aria-hidden') === 'true') return;
        if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return;
        const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim().length > 1)
          .map(n => n.textContent.trim()).join(' ');
        if (!own || !/[\p{L}\p{N}]/u.test(own)) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.opacity === '0') return;
        const r = el.getBoundingClientRect();
        /* on screen, in full */
        if (r.top < 0 || r.bottom > window.innerHeight || r.width < 4 || r.height < 4) return;
        const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight, 10) || 400;
        el.setAttribute('data-cpc', String(out.length));
        out.push({
          idx: out.length,
          label: (el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className
                  ? '.' + el.className.trim().split(/\s+/).join('.') : '')).slice(0, 40),
          sample: own.slice(0, 26), color: cs.color,
          large: size >= 24 || (size >= 18.66 && weight >= 700),
          clipped: (cs.webkitTextFillColor || '').includes('rgba(0, 0, 0, 0)'),
          rect: { x: Math.max(0, Math.round(r.left)), y: Math.max(0, Math.round(r.top)),
                  w: Math.min(Math.round(r.width), 1400), h: Math.min(Math.round(r.height), 220) },
        });
      });
      return out;
    });
    await setBlank(true);
    await page.waitForTimeout(250);
    const plate = (await page.screenshot()).toString('base64');

    const rows = await probe.evaluate(async ({ inked, plate, targets }) => {
      const load = async (b64) => { const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej;
                                          img.src = 'data:image/png;base64,' + b64; });
        const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0); return c.getContext('2d'); };
      const A = await load(inked), B = await load(plate);
      const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const ratio = (a, b) => { const [hi, lo] = a > b ? [a, b] : [b, a]; return (hi + 0.05) / (lo + 0.05); };
      const parse = s => (s.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
      return targets.map(t => {
        const { x, y, w, h } = t.rect;
        if (w < 1 || h < 1) return null;
        const a = A.getImageData(x, y, w, h).data, b = B.getImageData(x, y, w, h).data;
        let ink = parse(t.color), best = -1; const idx = [];
        for (let i = 0; i < a.length; i += 4) {
          const dl = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i+1] - b[i+1]), Math.abs(a[i+2] - b[i+2]));
          if (dl < 40) continue;
          idx.push(i);
          if (t.clipped && dl > best) { best = dl; ink = [a[i], a[i+1], a[i+2]]; }
        }
        if (!idx.length || idx.length > 0.45 * w * h) return null;
        const fl = lum(ink[0], ink[1], ink[2]);
        const scored = idx.map(i => ({ r: ratio(fl, lum(b[i], b[i+1], b[i+2])), p: [b[i], b[i+1], b[i+2]] }))
                          .sort((p, q) => p.r - q.r);
        const at = scored[Math.min(scored.length - 1, Math.floor(scored.length * 0.02))];
        return { idx: t.idx, label: t.label, sample: t.sample, large: t.large, ratio: at.r, px: at.p };
      }).filter(Boolean);
    }, { inked, plate, targets });

    /* A failing row is re-measured from a pair of screenshots clipped to that
       one element before it is believed. A viewport-sized capture can differ
       by a pixel at a rounded button's edge, and one such pixel is enough to
       report a 1.04:1 on a control that is plainly readable. */
    for (const r of rows) {
      const min = r.large ? 3.0 : 4.5;
      if (r.ratio < min) {
        const again = await verify(r.idx, r.label);
        if (again !== null) r.ratio = again.ratio, r.px = again.px;
      }
      const key = r.label + '|' + r.sample;
      const prev = worstByLabel.get(key);
      if (!prev || r.ratio < prev.ratio) worstByLabel.set(key, { ...r, y });
    }
    console.log(`  scroll ${String(y).padStart(5)}px  ${rows.length} text styles on screen`);
  }
  await browser.close();

  const hex = p => '#' + p.map(v => v.toString(16).padStart(2, '0')).join('');
  console.log(`\nWORST ratio for each text style across ${STOPS} scroll positions @${WIDTH}px\n`);
  [...worstByLabel.values()].sort((a, b) => a.ratio - b.ratio).forEach(r => {
    const min = r.large ? 3.0 : 4.5, ok = r.ratio >= min;
    ok ? pass++ : fail++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${r.ratio.toFixed(2).padStart(6)}:1 (needs ${min.toFixed(1)}) ` +
      `at y=${String(r.y).padEnd(5)} ${r.label.padEnd(40)} on ${hex(r.px)}  "${r.sample}"`);
  });
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
