#!/usr/bin/env node
/**
 * Header and search-bar QA across the widths that matter.
 *
 *   python3 -m http.server 8765 --directory public &
 *   node scripts/qa-header.js [url]
 *
 * Fails on the three things that actually go wrong with a segmented bar:
 * a label or value truncated to an ellipsis, the page overflowing
 * horizontally, and any control smaller than the 44px touch target. Also
 * asserts that Age is reachable at every width — in the bar on wide screens,
 * inside the sheet on narrow ones, never neither and never both.
 */
const URL_ = process.argv[2] || 'http://localhost:8765/seasons/halloween/';
const WIDTHS = [1440, 1280, 1024, 900, 768, 700, 640, 620, 560, 414, 390, 360, 320];
const fs = require('fs');
function findPlaywright() {
  for (const p of ['/opt/node22/lib/node_modules/playwright', 'playwright']) {
    try { return require(p); } catch (e) {}
  }
  throw new Error('playwright not found');
}
let pass = 0, fail = 0;
const A = (l, a, e) => { const ok = JSON.stringify(a) === JSON.stringify(e); ok ? pass++ : fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${l.padEnd(46)} ${JSON.stringify(a)}` +
              (ok ? '' : `  expected ${JSON.stringify(e)}`)); };

(async () => {
  const { chromium } = findPlaywright();
  const browser = await chromium.launch({
    executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
  const origin = new URL(URL_).origin;
  for (const w of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.route('**/*', r => r.request().url().startsWith(origin) ? r.continue() : r.abort());
    await page.goto(URL_, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1300);
    const r = await page.evaluate(() => {
      const vis = el => !!(el && el.offsetParent);
      const truncated = [...document.querySelectorAll('.seg-v,.seg-l,.bar-hint,.hh-nav a,.hh-stats dd')]
        .filter(e => vis(e) && e.scrollWidth > e.clientWidth + 1)
        .map(e => e.textContent.trim().slice(0, 22));
      const tiny = [...document.querySelectorAll('.hh-bar button, .hh-nav a, .tile')]
        .filter(e => vis(e) && e.getBoundingClientRect().height < 44)
        .map(e => (e.id || e.className || e.tagName).toString().slice(0, 22));
      const ageInBar = vis(document.querySelector('.seg-age'));
      document.getElementById('barAdj').click();
      const ageInSheet = vis(document.getElementById('sheetAgeRow'));
      /* Only what is actually on screen: a display:none row measures 0 tall
         and would report every control in it as an undersized target. */
      const sheetTiny = [...document.querySelectorAll('#hhSheet button')]
        .filter(e => vis(e) && e.getBoundingClientRect().height < 44)
        .map(e => e.textContent.trim().slice(0, 16));
      return { truncated, tiny, ageInBar, ageInSheet, sheetTiny,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
    });
    await page.close();
    console.log(`\n${w}px`);
    A('no truncated label or value', r.truncated, []);
    A('no horizontal page overflow', r.overflow, false);
    A('every bar/nav control >= 44px', r.tiny, []);
    A('every sheet control >= 44px', r.sheetTiny, []);
    A('Age reachable in exactly one place', [r.ageInBar, r.ageInSheet].filter(Boolean).length, 1);
  }
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
