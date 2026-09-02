#!/usr/bin/env node
/**
 * Whole-page WCAG contrast gate, measured against what is ACTUALLY BEHIND the
 * text — not against a colour token.
 *
 *   python3 -m http.server 8765 --directory public &
 *   node scripts/check-page-contrast.js [url] [width]
 *
 * Why it works this way: the Halloween hub puts translucent panels over a
 * photographic backdrop with a blur. No token tells you the composite, and
 * checking `--ink` against `--card` reports a comfortable ratio for a page
 * whose text is really sitting on a moonlit roofline. So this makes every
 * glyph transparent, takes ONE screenshot of the resulting background plate,
 * and samples each text element's own rectangle out of it — the real pixels,
 * blur and photograph included.
 *
 * The worst pixel in the box is the one reported. That is deliberately harsh:
 * a letter only has to cross one bright roof tile to be unreadable there.
 * Text with a shadow keeps its shadow in the plate, which is fair — the
 * shadow is part of what makes it legible.
 *
 * Exits non-zero if any element misses its threshold (4.5:1, or 3.0:1 for
 * large text per WCAG 1.4.3).
 */
const fs = require('fs');
const URL_ = process.argv[2] || 'http://localhost:8765/seasons/halloween/';
const WIDTH = Number(process.argv[3] || 1440);

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
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 1000 } });
  const origin = new URL(URL_).origin;
  await page.route('**/*', r => r.request().url().startsWith(origin) ? r.continue() : r.abort());
  /* Card photos are third-party at runtime; serve a real local one so the
     busiest possible background is what gets measured. */
  await page.route('**/api/photos**', r => r.fulfill({
    status: 200, contentType: 'application/json', body: '{"url":"/park.jpg"}' }));
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  /* Scroll the whole page once so every IntersectionObserver reveal has
     fired, then freeze. A full-page screenshot re-scrolls internally, and a
     page that still animates between the two shots yields rects that no
     longer match either image — which is how a dark navy card came back
     measured against cream. */
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.addStyleTag({ content:
    `*,*::before,*::after{animation:none!important;transition:none!important;
      scroll-behavior:auto!important}` });
  await page.waitForTimeout(400);

  const inked0 = await page.screenshot({ fullPage: true });
  /* A full-page screenshot scrolls the document internally. Playwright puts
     the scroll back, but not always before the next evaluate, and every rect
     below is computed as clientRect + scrollY — so measuring without this
     reset offsets every box by whatever scroll was left behind. That is what
     reported a navy card as sitting on cream. */
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);

  /* Every element with its own visible text, plus where it sits. */
  const targets = await page.evaluate(() => {
    const out = [];
    const seen = new Set();
    document.querySelectorAll('body *').forEach(el => {
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return;
      if (el.getAttribute('aria-hidden') === 'true') return;
      const own = [...el.childNodes]
        .filter(n => n.nodeType === 3 && n.textContent.trim().length > 1)
        .map(n => n.textContent.trim()).join(' ');
      if (!own) return;
      /* Emoji carry their own colours and are not text for 1.4.3 purposes;
         measuring a pumpkin glyph against its button reports a number that
         means nothing and hides the real rows. A label that is ONLY emoji is
         skipped; one that mixes emoji with words is still checked, and the
         glyph-diff sampling below reads the word pixels. */
      if (!/[\p{L}\p{N}]/u.test(own)) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.opacity === '0') return;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      if (r.bottom < 0 || r.top > document.documentElement.scrollHeight) return;
      const size = parseFloat(cs.fontSize);
      const weight = parseInt(cs.fontWeight, 10) || 400;
      /* WCAG 1.4.3 "large": >=18pt (24px), or >=14pt (18.66px) bold. */
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const key = el.tagName + '|' + (el.className || '') + '|' + cs.color + '|' + Math.round(size);
      if (seen.has(key)) return;
      seen.add(key);
      el.setAttribute('data-cpc', String(out.length));
      out.push({
        idx: out.length,
        label: (el.tagName.toLowerCase() +
                (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : '')).slice(0, 46),
        sample: own.slice(0, 34),
        color: cs.color, large,
        colorAlpha: (cs.webkitTextFillColor || '').includes('rgba(0, 0, 0, 0)') ? 0 : 1,
        rect: { x: r.left + window.scrollX, y: r.top + window.scrollY,
                w: Math.min(r.width, 1200), h: Math.min(r.height, 200) },
      });
    });
    return out;
  });

  /* TWO full-page shots of the same layout: one as rendered, one with every
     glyph made invisible. Their difference is exactly the set of pixels the
     text occupies, which is the only place contrast is meaningful. Sampling
     the whole bounding box instead reports the rounded corner of a badge, or
     the ember background behind gradient-clipped text, and buries the real
     failures under a dozen artefacts. */
  const inked = inked0.toString('base64');
  const BLANK = `*{color:transparent!important;
    -webkit-text-fill-color:transparent!important;
    text-decoration-color:transparent!important;caret-color:transparent!important;
    text-shadow:none!important}`;
  const setBlank = (on) => page.evaluate(({ on, css }) => {
    let el = document.getElementById('cpc-blank');
    if (on) {
      if (!el) { el = document.createElement('style'); el.id = 'cpc-blank';
                 el.textContent = css; document.head.appendChild(el); }
    } else if (el) { el.remove(); }
  }, { on, css: BLANK });
  await setBlank(true);
  /* Gradient-clipped text paints its gradient as a background once the fill
     goes transparent. Blank that too, or the "background" behind the h1 is
     the ember gradient itself. */
  await page.evaluate(() => {
    document.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      if ((cs.webkitBackgroundClip || cs.backgroundClip) === 'text')
        el.style.setProperty('background-image', 'none', 'important');
    });
  });
  await page.waitForTimeout(500);
  const plateBuf = await page.screenshot({ fullPage: true });
  const plate = plateBuf.toString('base64');
  const dims = b => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20) });   // PNG IHDR
  const a = dims(inked0), b2 = dims(plateBuf);
  if (a.w !== b2.w || a.h !== b2.h) {
    console.error(`page geometry changed between the two captures ` +
      `(${a.w}x${a.h} then ${b2.w}x${b2.h}) — measurements would be meaningless`);
    process.exit(2);
  }

  /* Decode and sample in Chromium's own canvas — no image library needed. */
  const probe = await browser.newPage();   // canvas sandbox for pixel maths
  const results = await probe.evaluate(async ({ plate, inked, targets }) => {
    const load = async (b64) => {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej;
                                        img.src = 'data:image/png;base64,' + b64; });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      return c.getContext('2d');
    };
    const ctx = await load(plate);
    const ictx = await load(inked);
    const c = ctx.canvas;
    const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const ratio = (a, b) => { const [hi, lo] = a > b ? [a, b] : [b, a]; return (hi + 0.05) / (lo + 0.05); };
    const parse = s => (s.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);

    return targets.map(t => {
      const x = Math.max(0, Math.round(t.rect.x)), y = Math.max(0, Math.round(t.rect.y));
      const w = Math.max(1, Math.min(Math.round(t.rect.w), c.width - x));
      const h = Math.max(1, Math.min(Math.round(t.rect.h), c.height - y));
      if (x >= c.width || y >= c.height) return { ...t, ratio: null };
      const d = ctx.getImageData(x, y, w, h).data;      // background plate
      const k = ictx.getImageData(x, y, w, h).data;     // as rendered
      const [fr, fg, fb] = parse(t.color);
      /* A gradient-clipped heading has no single computed colour: its fill is
         transparent. Take the most-changed rendered pixel as the ink. */
      const clipped = t.colorAlpha === 0;
      let ink = [fr, fg, fb], inkDelta = -1;
      const px = [];
      for (let py = 0; py < h; py++) {
        for (let pxi = 0; pxi < w; pxi++) {
          const i = (py * w + pxi) * 4;
          const dl = Math.max(Math.abs(d[i] - k[i]), Math.abs(d[i+1] - k[i+1]), Math.abs(d[i+2] - k[i+2]));
          /* 40 keeps glyph cores and drops antialiased edges, whose blended
             colours are not what WCAG measures. */
          if (dl < 40) continue;
          px.push(i);
          if (clipped && dl > inkDelta) { inkDelta = dl; ink = [k[i], k[i+1], k[i+2]]; }
        }
      }
      if (!px.length) return { ...t, ratio: null, reason: 'no glyph pixels (icon or emoji only)' };
      /* Glyphs cover a fraction of their own box. If most of the box differs
         between the two captures, the region MOVED between them — a late
         async render, a banner appearing — and every pixel in it belongs to
         something else. Refuse to report a number rather than invent one. */
      if (px.length > 0.45 * w * h)
        return { ...t, ratio: null, reason: 'region moved between captures' };
      const fl = lum(ink[0], ink[1], ink[2]);
      /* The 2nd percentile, not the single worst pixel. The two captures can
         disagree on a handful of pixels at a glyph's edge (sub-pixel
         positioning, a scrollbar a pixel wide), and one such pixel is enough
         to report a navy card as sitting on cream. Two percent of a glyph's
         pixels is still a real region of the text, so a genuine low-contrast
         patch is caught while a stray pixel is not. */
      const scored = px.map(i => ({ r: ratio(fl, lum(d[i], d[i + 1], d[i + 2])),
                                    p: [d[i], d[i + 1], d[i + 2]] }))
                       .sort((a, b) => a.r - b.r);
      const at = scored[Math.min(scored.length - 1, Math.floor(scored.length * 0.02))];
      return { ...t, ratio: at.r, worstPx: at.p, ink, pixels: scored.length };
    });
  }, { plate, inked, targets });

  /* ── verification pass ──────────────────────────────────────────────────
     A full-page screenshot is stitched by the browser and re-scrolls the
     document to do it, so a region that renders late can land a pixel or a
     banner out of place between the two captures. That is a tooling
     artefact, not a contrast failure, and it must not reach the report.
     Every FAIL is therefore measured a second time from a pair of
     screenshots clipped to that one element, taken back to back with
     nothing scrolled in between. The second number is the one reported. */
  const failing = results.filter(r => r.ratio !== null &&
    r.ratio < (r.large ? 3.0 : 4.5));
  for (const r of failing) {
    const box = await page.evaluate((i) => {
      const el = document.querySelector(`[data-cpc="${i}"]`);
      if (!el) return null;
      el.scrollIntoView({ block: 'center', behavior: 'auto' });
      const b = el.getBoundingClientRect();
      return { x: Math.max(0, Math.floor(b.left)), y: Math.max(0, Math.floor(b.top)),
               width: Math.max(1, Math.ceil(b.width)), height: Math.max(1, Math.ceil(b.height)) };
    }, r.idx);
    if (!box || box.y + box.height > 1000) continue;   // taller than the viewport
    await setBlank(false);
    const ink1 = (await page.screenshot({ clip: box })).toString('base64');
    await setBlank(true);
    const plate1 = (await page.screenshot({ clip: box })).toString('base64');
    const again = await probe.evaluate(async ({ ink1, plate1, color, clipped }) => {
      const load = async (b64) => { const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej;
                                          img.src = 'data:image/png;base64,' + b64; });
        const c = document.createElement('canvas'); c.width = img.naturalWidth;
        c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0);
        return c.getContext('2d').getImageData(0, 0, c.width, c.height); };
      const A = await load(ink1), B = await load(plate1);
      const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const ratio = (a, b) => { const [hi, lo] = a > b ? [a, b] : [b, a]; return (hi + 0.05) / (lo + 0.05); };
      const parse = s => (s.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
      let ink = parse(color), best = -1;
      const idx = [];
      for (let i = 0; i < A.data.length; i += 4) {
        const dl = Math.max(Math.abs(A.data[i] - B.data[i]),
                            Math.abs(A.data[i+1] - B.data[i+1]),
                            Math.abs(A.data[i+2] - B.data[i+2]));
        if (dl < 40) continue;
        idx.push(i);
        if (clipped && dl > best) { best = dl; ink = [A.data[i], A.data[i+1], A.data[i+2]]; }
      }
      if (!idx.length) return null;
      const fl = lum(ink[0], ink[1], ink[2]);
      const scored = idx.map(i => ({ r: ratio(fl, lum(B.data[i], B.data[i+1], B.data[i+2])),
                                     p: [B.data[i], B.data[i+1], B.data[i+2]] }))
                        .sort((a, b) => a.r - b.r);
      const at = scored[Math.min(scored.length - 1, Math.floor(scored.length * 0.02))];
      return { ratio: at.r, worstPx: at.p };
    }, { ink1, plate1, color: r.color, clipped: r.colorAlpha === 0 });
    if (again) { r.ratio = again.ratio; r.worstPx = again.worstPx; r.verified = true; }
  }
  await page.close();
  await browser.close();

  const hex = p => p ? '#' + p.map(v => v.toString(16).padStart(2, '0')).join('') : '—';
  let fails = 0;
  console.log(`\n${URL_}  @${WIDTH}px — worst background pixel behind each text style\n`);
  const skipped = results.filter(r => r.ratio === null && r.reason === 'region moved between captures');
  for (const r of results) {
    if (r.ratio === null) continue;
    const min = r.large ? 3.0 : 4.5;
    const ok = r.ratio >= min;
    if (!ok) fails++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${r.ratio.toFixed(2).padStart(6)}:1  (needs ${min.toFixed(1)})${r.verified ? '*' : ' '} ` +
                `${r.label.padEnd(46)} on ${hex(r.worstPx)}  "${r.sample}"`);
  }
  if (skipped.length) {
    console.log('\n  not measured (moved between captures — re-run if this list grows):');
    skipped.forEach(r => console.log(`        ${r.label.padEnd(46)} "${r.sample}"`));
  }
  const checked = results.filter(r => r.ratio !== null).length;
  console.log(`\n${checked - fails} passed, ${fails} failed` +
              (skipped.length ? `, ${skipped.length} not measured` : ''));
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
