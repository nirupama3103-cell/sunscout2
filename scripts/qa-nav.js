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

  /* Exactly these four, in this order, on every page. Camps came out of
     the bar when the nav went to four items; its route is untouched and
     its filters are reachable from the cost chips and the search panel,
     which the reachability block below proves. */
  const SHARED = ['Home', 'Local Table', 'DIY', 'Halloween'];
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
      if (label === 'mobile') {
        const tabs = await page.evaluate(() => {
          const bar = document.getElementById('bottom-nav');
          /* NOT offsetParent: the bar is position:fixed, and a fixed element
             always reports offsetParent null. That is the same trap that
             made an earlier check call every bar invisible. */
          if (!bar || getComputedStyle(bar).display === 'none') return null;
          return [...bar.querySelectorAll('.bnav-label')].map(e => e.textContent.trim());
        });
        A('the footer bar is on screen', tabs !== null, true);
        if (tabs) {
          /* Equality, not containment: no page may add a sixth tab. */
          A('carries exactly the four shared tabs, in order', tabs, SHARED);
          const small = await page.evaluate(() => [...document.querySelectorAll('#bottom-nav .bnav-btn')]
            .filter(e => e.getBoundingClientRect().height < 44).length);
          A('every footer tab is at least 44px tall', small, 0);
          /* NAV-01's actual complaint: the bar scrolled sideways and the
             last tab was clipped. Five tabs must fit 390px outright. */
          const geo = await page.evaluate(() => {
            const items = document.querySelector('#bottom-nav .bnav-items');
            const btns = [...document.querySelectorAll('#bottom-nav .bnav-btn')];
            const barRight = items.getBoundingClientRect().right;
            return { overflow: items.scrollWidth - items.clientWidth,
                     clipped: btns.filter(b => b.getBoundingClientRect().right > barRight + 1).length };
          });
          A('bar does not scroll sideways at 390px', geo.overflow <= 1, true);
          A('no tab is clipped off the right edge', geo.clipped, 0);
          /* A11Y-01: a tab's accessible name must be the destination, not a
             picture. Emoji in the label would be read out literally. */
          const emojiTabs = await page.evaluate(() =>
            [...document.querySelectorAll('#bottom-nav .bnav-label')]
              .filter(e => /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(e.textContent)).length);
          A('no emoji in any tab label', emojiTabs, 0);
        }
      }
      links.forEach(l => { try { const u = new URL(l.abs);
        if (u.origin === BASE) seen.add(u.pathname); } catch (e) {} });
      await page.close();
    }
  }

  /* Removing a filter from the footer bar must not strand it. */
  console.log('\nHomepage: every canonical tab is still reachable on a phone');
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.route('**/*', r => r.request().url().startsWith(BASE) ? r.continue() : r.abort());
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);
    /* The drawer is gone; its filters moved into the header search panel.
       Two separate things are checked here.

       First the contract a person actually meets: focusing the input must
       open the panel. */
    const opensOnFocus = await page.evaluate(() => {
      const panel = document.querySelector('.hsearch-panel');
      const shut = getComputedStyle(panel).display;
      document.getElementById('desktopSearch').focus();
      return { shut, open: getComputedStyle(panel).display };
    });
    A('search panel is closed at rest', opensOnFocus.shut, 'none');
    A('focusing the input opens it', opensOnFocus.open !== 'none', true);

    /* Then reachability. Drive it from script rather than real focus and
       clicks: card rendering finishes asynchronously and steals focus back,
       which made a real-focus version of this check flaky rather than
       wrong. Reachable means a person can get there in a tap or two, not
       that it is already on screen. */
    await page.evaluate(() => {
      document.getElementById('desktopSearch').focus();
      const e = document.getElementById('ssc-explore');
      if (e) e.click();
    });
    await page.waitForTimeout(300);
    const reach = await page.evaluate(() => {
      /* Free and Paid left the footer bar for the Camps tab, so the
         canonical .tab-btn row and the drawer are what must still carry
         them. Nothing may become unreachable on a phone. */
      const txt = [...document.querySelectorAll(
          '#bottom-nav .bnav-label, .hsearch-panel button, .hsearch-panel [onclick], '
          + '#ssd-explore [onclick], .tab-bar .tab-label, .cost-chip')]
        .filter(e => e.offsetParent).map(e => e.textContent.trim().toLowerCase());
      const has = w => txt.some(t => t.includes(w));
      return { free: has('free'), paid: has('paid'), outdoor: has('outdoor'),
               indoor: has('indoor'), weekend: has('weekend') };
    });
    for (const [k, v] of Object.entries(reach)) A(`${k} reachable`, v, true);
    /* About Us left the footer bar (it was the seventh, clipped tab).
       It must still be openable from a visible control on a phone. */
    const aboutReachable = await page.evaluate(() =>
      [...document.querySelectorAll('[onclick*="about-modal"]')]
        .some(e => e.offsetParent !== null));
    A('about reachable', aboutReachable, true);
    await page.close();
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
