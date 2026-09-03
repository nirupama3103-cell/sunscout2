#!/usr/bin/env node
/**
 * Cross-page navigation QA.
 *
 *   python3 -m http.server 8765 --directory public &
 *   node scripts/qa-nav.js
 *
 * Asserts the four pages can all reach each other, on a phone and on a
 * desktop, and that every one of those links resolves. A nav item that
 * points at a 404 is worse than a missing one.
 */
const BASE = process.argv[2] || 'http://localhost:8765';
const PAGES = [
  ['home',        '/'],
  ['local-table', '/local-table/'],
  ['diy',         '/diy.html'],
  ['halloween',   '/seasons/halloween/'],
];
/* Every page must offer a route to the other three. */
const DEST = { home: '/', 'local-table': '/local-table/', diy: '/diy.html',
               halloween: '/seasons/halloween/' };
const fs = require('fs');
function findPlaywright() {
  for (const p of ['/opt/node22/lib/node_modules/playwright', 'playwright']) {
    try { return require(p); } catch (e) {}
  }
  throw new Error('playwright not found');
}
let pass = 0, fail = 0;
const A = (l, a, e) => { const ok = JSON.stringify(a) === JSON.stringify(e); ok ? pass++ : fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${l.padEnd(56)} ${JSON.stringify(a)}` +
              (ok ? '' : `  expected ${JSON.stringify(e)}`)); };

(async () => {
  const { chromium } = findPlaywright();
  const browser = await chromium.launch({
    executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });

  const seen = new Set();
  for (const [name, path] of PAGES) {
    for (const [label, vp] of [['mobile', { width: 390, height: 844 }],
                               ['desktop', { width: 1440, height: 900 }]]) {
      const page = await browser.newPage({ viewport: vp });
      await page.route('**/*', r => r.request().url().startsWith(BASE) ? r.continue() : r.abort());
      await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1600);
      const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')]
        .filter(a => a.offsetParent !== null)
        .map(a => ({ href: a.getAttribute('href'), abs: a.href })));
      console.log(`\n${name} · ${label}`);
      for (const [dname, dpath] of Object.entries(DEST)) {
        if (dname === name) continue;
        const hit = links.some(l => {
          try { return new URL(l.abs).pathname.replace(/index\.html$/, '') === dpath.replace(/index\.html$/, ''); }
          catch (e) { return false; }
        });
        A(`can reach ${dname}`, hit, true);
      }
      links.forEach(l => { try { const u = new URL(l.abs);
        if (u.origin === BASE) seen.add(u.pathname); } catch (e) {} });
      await page.close();
    }
  }

  console.log('\nEvery internal link resolves');
  for (const p of [...seen].sort()) {
    const r = await fetch(BASE + p).catch(() => null);
    if (!r) { fail++; console.log(`  FAIL  unreachable ${p}`); continue; }
    const ok = r.status === 200; ok ? pass++ : fail++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${String(r.status).padEnd(4)} ${p}`);
  }

  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
